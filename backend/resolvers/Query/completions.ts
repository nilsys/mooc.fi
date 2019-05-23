import { ForbiddenError, UserInputError } from "apollo-server-core";
import { Course } from "../../generated/prisma-client";
import fetchCompletions from "../../middlewares/fetchCompletions";

const completions = async (_, { course, first, after, last, before }, ctx) => {
    if (!ctx.user.administrator) {
        throw new ForbiddenError("Access Denied");
    }
    if ((!first && !last) || (first > 50 || last > 50))  {
        ctx.disableRelations = true
    }
    const courseWithSlug: Course = await ctx.prisma.course(
        { slug: course }
    )
    if (!courseWithSlug) {
        const courseFromAvoinCourse: Course = await ctx.prisma.openUniversityCourse(
            { course_code: course }
        ).course()
        if (!courseFromAvoinCourse) {
            throw new UserInputError("Invalid course identifier")
        }
        course = courseFromAvoinCourse.slug
    }
    const completions = await fetchCompletions({ course, first, after, last, before }, ctx);

    return completions
}

export default completions