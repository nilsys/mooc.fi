import React from "react"
import NextI18Next from "../i18n"
import { isSignedIn } from "../lib/authentication"
import { NextContext } from "next"
import redirect from "../lib/redirect"
import { ApolloClient, gql } from "apollo-boost"
import { useQuery } from "react-apollo-hooks"
import { UserOverView as UserOverViewData } from "./__generated__/UserOverView"
import styled from "styled-components"
import Typography from "@material-ui/core/Typography"

export const UserOverViewQuery = gql`
  query UserOverView {
    currentUser {
      id
      upstream_id
      first_name
      last_name
      email
      completions {
        id
        completion_language
        student_number
        created_at
        course {
          id
          slug
          name
        }
        completions_registered {
          id
          created_at
          organization {
            slug
          }
        }
      }
    }
  }
`
const Title = styled(Typography)`
  font-family: "Open Sans Condensed", sans-serif !important;
  margin-top: 7rem;
  margin-left: 2rem;
  margin-bottom: 1rem;
  @media (min-width: 320px) {
    font-size: 46px;
  }
  @media (min-width: 600px) {
    font-size: 56px;
  }
  @media (min-width: 960px) {
    font-size: 72px;
  }
`
type Organization = {
  slug: string
}
type Registration = {
  id: any
  created_at: any
  organization: Organization
}
type Course = {
  id: any
  slug: string
  name: string
}
type Completion = {
  id: any
  completion_language: string
  student_number: string
  created_at: any
  course: Course
  completions_registered: Registration[]
}

function MyProfile() {
  const { loading, error, data } = useQuery<UserOverViewData>(UserOverViewQuery)

  if (error) {
    return (
      <div>
        Error: <pre>{JSON.stringify(error, undefined, 2)}</pre>
      </div>
    )
  }

  if (loading || !data) {
    return <div>Loading</div>
  }

  return (
    <section>
      <Title component="h1" variant="h2" align="center">
        Profile
      </Title>
    </section>
  )
}

MyProfile.getInitialProps = function(context: NextContext) {
  redirect(context, "/my-profile/completions")

  return {
    namespacesRequired: ["common"],
  }
}

export default MyProfile