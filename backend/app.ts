require("sharp") // image library sharp seems to crash without this require

import { use, schema, settings, server } from "nexus"
import { prisma } from "nexus-plugin-prisma"
import Knex from "./services/knex"
import { redisify } from "./services/redis"
import { wsListen } from "./wsServer"
import * as winston from "winston"
import { Role } from "./accessControl"
import { shield, rule, deny, not, and, or } from "nexus-plugin-shield"

const JSONStream = require("JSONStream")

use(prisma({ migrations: false }))

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "backend" },
  transports: [new winston.transports.Console()],
})

schema.addToContext((req) => ({
  ...req,
  user: undefined,
  organization: undefined,
  disableRelations: false,
  role: Role.VISITOR,
  userDetails: undefined,
  tmcClient: undefined,
}))

settings.change({
  schema: {
    generateGraphQLSDLFile: "./generated/schema.graphql",
  },
})

const isOrganization = rule({ cache: "contextual" })(
  async (parent, args, ctx: NexusContext, info) =>
    ctx.role === Role.ORGANIZATION,
)

const isAdmin = rule({ cache: "contextual" })(
  async (parent, args, ctx: NexusContext, info) => ctx.role === Role.ADMIN,
)

const isVisitor = rule({ cache: "contextual" })(
  async (parent, args, ctx: NexusContext, info) => ctx.role === Role.VISITOR,
)

const isUser = rule({ cache: "contextual" })(
  async (parent, args, ctx: NexusContext, info) => ctx.role === Role.USER,
)

const permissions = shield({
  rules: {
    Query: {
      course: not(isVisitor),
      course_exists: not(isVisitor),
      courseAliases: not(isVisitor),
      courseTranslations: and(not(isVisitor), not(isOrganization)),
      emailTemplate: not(isVisitor),
      emailTemplates: not(isVisitor),
      exercise: not(isVisitor),
      exercises: not(isVisitor),
      exerciseCompletion: not(isVisitor),
      exerciseCompletions: not(isVisitor),
      openUniversityRegistrationLink: not(isVisitor),
      openUniversityRegistrationLinks: not(isVisitor),
      registerCompletions: not(isVisitor),
      service: not(isVisitor),
      services: not(isVisitor),
      study_module: and(not(isVisitor), not(isOrganization)),
      study_module_exists: not(isVisitor),
      studyModuleTranslations: and(not(isVisitor), not(isOrganization)),
      user: not(isVisitor),
      users: not(isVisitor),
      userDetailsContains: not(isVisitor),
      UserCourseProgress: isAdmin,
      UserCourseProgresses: not(isVisitor),
      UserCourseServiceProgress: not(isVisitor),
      userCourseServiceProgresses: not(isVisitor),
      UserCourseSettings: not(isVisitor),
      userCourseSettingsCount: not(isVisitor),
      UserCourseSettingses: not(isVisitor),
    },
  },
})

use(permissions)

server.express.get("/api/completions/:course", async function (
  req: any,
  res: any,
) {
  const rawToken = req.get("Authorization")
  const secret: string = rawToken?.split(" ")[1] ?? ""
  let course_id: string
  const org = (
    await Knex.select("*")
      .from("organization")
      .where({ secret_key: secret })
      .limit(1)
  )[0]
  if (!org) {
    return res.status(401).json({ message: "Access denied." })
  }
  const course = (
    await Knex.select("id")
      .from("course")
      .where({ slug: req.params.course })
      .limit(1)
  )[0]
  if (!course) {
    const course_alias = (
      await Knex.select("course")
        .from("course_alias")
        .where({ course_code: req.params.course })
    )[0]
    if (!course_alias) {
      return res.status(404).json({ message: "Course not found" })
    }
    course_id = course_alias.course
  } else {
    course_id = course.id
  }
  const sql = Knex.select("*").from("completion").where({ course: course_id })
  res.set("Content-Type", "application/json")
  const stream = sql.stream().pipe(JSONStream.stringify()).pipe(res)
  req.on("close", stream.end.bind(stream))
})

type UserCourseSettingsCountResult =
  | {
      course: string
      language: string
      count?: number
    }
  | {
      course: string
      language: string
      error: true
    }

server.express.get(
  "/api/usercoursesettingscount/:course/:language",
  async (req: any, res: any) => {
    const {
      course,
      language,
    }: { course: string; language: string } = req.params

    if (!course || !language) {
      return res
        .status(400)
        .json({ message: "Course and/or language not specified" })
    }

    const resObject = await redisify<UserCourseSettingsCountResult>(
      async () => {
        let course_id: string

        const { id } =
          (
            await Knex.select("course.id")
              .from("course")
              .join("user_course_settings_visibility", {
                "course.id": "user_course_settings_visibility.course",
              })
              .where({
                slug: course,
                "user_course_settings_visibility.language": language,
              })
              .limit(1)
          )[0] ?? {}

        if (!id) {
          const courseAlias = (
            await Knex.select("course_alias.course")
              .from("course_alias")
              .join("course", { "course_alias.course": "course.id" })
              .join("user_course_settings_visibility", {
                "course.id": "user_course_settings_visibility.course",
              })
              .where({
                course_code: course,
                "user_course_settings_visibility.language": language,
              })
          )[0]
          course_id = courseAlias?.course
        } else {
          course_id = id
        }

        if (!course_id) {
          return { course, language, error: true }
        }

        let { count } = (
          await Knex.countDistinct("id as count")
            .from("UserCourseSettings")
            .where({ course: course_id, language: language })
        )?.[0]

        if (count < 100) {
          count = -1
        } else {
          const factor = count < 10000 ? 100 : 1000
          count = Math.floor(Number(count) / factor) * factor
        }

        return { course, language, count: Number(count) }
      },
      {
        prefix: "usercoursesettingscount",
        expireTime: 3600000, // hour
        key: `${course}-${language}`,
      },
    )

    if (resObject.error) {
      return res
        .status(403)
        .json({ message: "Course not found or user count not set to visible" })
    }

    res.json(resObject)
  },
)

// wsListen()
