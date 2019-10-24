import React from "react"
import { Grid } from "@material-ui/core"
import PointsListItemCard from "./PointsListItemCard"
import { UserCourseSettingses_UserCourseSettingses_edges as Points } from "/static/types/generated/UserCourseSettingses"

interface Props {
  pointsForUser: Points[]
  cutterValue: number
}

const PointsList = (props: Props) => {
  const { pointsForUser, cutterValue } = props
  console.log(pointsForUser)
  return (
    <section>
      <Grid container spacing={3}>
        {pointsForUser.map(p =>
          p && p.node && p.node.user && p.node.user.progress ? (
            <PointsListItemCard
              pointsAll={p.node.user.progress}
              cutterValue={cutterValue}
              showPersonalDetails={true}
              personalDetails={{
                firstName: p.node.user.first_name
                  ? p.node.user.first_name
                  : "n/a",
                lastName: p.node.user.last_name ? p.node.user.last_name : "n/a",
                email: p.node.user.email ? p.node.user.email : "n/a",
                sid: p.node.user.real_student_number
                  ? p.node.user.real_student_number
                  : p.node.user.student_number
                  ? p.node.user.student_number
                  : "n/a",
              }}
            />
          ) : (
            <></>
          ),
        )}
      </Grid>
    </section>
  )
}

export default PointsList