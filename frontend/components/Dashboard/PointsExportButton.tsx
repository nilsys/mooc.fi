import React, { useState } from "react"
import XLSX from "xlsx"
import gql from "graphql-tag"
import { ApolloConsumer } from "@apollo/react-hooks"
import { Button } from "@material-ui/core"

export interface PointsExportButtonProps {
  slug: string
}
function PointsExportButton(props: PointsExportButtonProps) {
  const { slug } = props

  const [infotext, setInfotext] = useState("Export")

  return (
    <ApolloConsumer>
      {client => (
        <div>
          {infotext}
          <Button
            disabled={!(infotext == "Export" || infotext == "ready")}
            onClick={async () => {
              setInfotext("Dowloading data")
              const { data } = await client.query({
                query: GET_DATA,
                variables: { course_slug: slug },
              })
              setInfotext("constructing csv")
              let objects = await flatten(data.UserCourseProgresses)
              console.log(data)
              console.log(objects)
              const sheet = XLSX.utils.json_to_sheet(objects)
              console.log("sheet", sheet)
              const workbook: XLSX.WorkBook = {
                SheetNames: [],
                Sheets: {},
              }
              XLSX.utils.book_append_sheet(
                workbook,
                sheet,
                "UserCourseProgress",
              )
              await XLSX.writeFile(workbook, slug + "-points.csv"),
                { bookType: "csv", type: "string" }
              setInfotext("ready")
            }}
          >
            Click me!
          </Button>
        </div>
      )}
    </ApolloConsumer>
  )
}

async function flatten(data: any[]) {
  console.log("data in flatten", data)
  const newData = data.map(datum => {
    const newDatum: any = {}
    newDatum.user_id = datum.user.upstream_id
    newDatum.first_name = datum.user.first_name
    newDatum.last_name = datum.user.last_name
    newDatum.email = datum.user.email
    newDatum.student_number = datum.user.student_number
    newDatum.confirmed_student_number = datum.user.real_student_number

    newDatum.course_variant = datum.UserCourseSettings.course_variant
    newDatum.country = datum.UserCourseSettings.country
    newDatum.language = datum.UserCourseSettings.language

    datum.progress.forEach((progress: any) => {
      newDatum[progress.group] = progress.n_points
    })

    return newDatum
  })
  return newData
}

export default PointsExportButton

const GET_DATA = gql`
  query UserCourseProgesses($course_slug: String!) {
    UserCourseProgresses(course_slug: $course_slug) {
      id
      user {
        id
        email
        student_number
        real_student_number
        upstream_id
        first_name
        last_name
      }
      progress
      UserCourseSettings {
        course_variant
        country
        language
      }
    }
  }
`
