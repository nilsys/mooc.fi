import React, { useState } from "react"
import DashboardTabBar from "../components/Dashboard/DashboardTabBar"
import CompletionsList from "../components/Dashboard/CompletionsList"
import PointsList from "../components/Dashboard/PointsList"
import LanguageSelector from "../components/Dashboard/LanguageSelector"
import DashboardBreadCrumbs from "../components/Dashboard/DashboardBreadCrumbs"
import { isSignedIn, isAdmin } from "../lib/authentication"
import redirect from "../lib/redirect"
import AdminError from "../components/Dashboard/AdminError"
import CourseDashboard from "../components/Dashboard/CourseDashboard"
import { NextContext } from "next"
import { WideContainer } from "../components/Container"
import { ApolloClient, gql } from "apollo-boost"
import { CourseDetails as CourseDetailsData } from "./__generated__/CourseDetails"
import { useQuery } from "react-apollo-hooks"
import { withRouter } from "next/router"

//map selection value of tab navigation
//to the component to be rendered
const MapTypeToComponent = {
  1: <CompletionsList />,
  2: <PointsList />,
  0: <CourseDashboard />,
}

export const CourseQuery = gql`
  query CourseDetails($slug: String) {
    course(slug: $slug) {
      id
      name
    }
  }
`

const Course = withRouter(props => {
  const { admin, router } = props
  const slug = router.query.course

  if (!admin) {
    return <AdminError />
  }

  //store which languages are selected
  const [languageValue, setLanguageValue] = useState({
    fi: true,
    en: true,
    se: true,
  })
  //store which tab is open
  const [selection, setSelection] = useState(0)

  const handleSelectionChange = (event, value) => {
    setSelection(value)
  }
  const handleLanguageChange = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLanguageValue({ ...languageValue, [name]: event.target.checked })
  }

  return (
    <section>
      <DashboardBreadCrumbs page={slug} />
      <DashboardTabBar value={selection} handleChange={handleSelectionChange} />
      <WideContainer>
        <LanguageSelector
          handleLanguageChange={handleLanguageChange}
          languageValue={languageValue}
        />
        {MapTypeToComponent[selection]}
      </WideContainer>
    </section>
  )
})

Course.getInitialProps = function(context: NextContext) {
  const admin = isAdmin(context)

  if (!isSignedIn(context)) {
    redirect(context, "/sign-in")
  }
  return {
    admin,
    namespacesRequired: ["common"],
  }
}

export default Course
