import React from "react"
import Grid from "@material-ui/core/Grid"
import CourseCard from "./CourseCard"
import Container from "/components/Container"
import styled from "styled-components"
import { AllCourses_courses } from "/static/types/generated/AllCourses"
import { H2Background, SubtitleBackground } from "/components/Text/headers"
import { BackgroundImage } from "/components/Images/GraphicBackground"
interface RootProps {
  backgroundColor: string
}

const Root = styled.div<RootProps>`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  padding-bottom: 4em;
  position: relative;
  ${(props) => `background-color: ${props.backgroundColor};`}
`

interface CourseHighlightsProps {
  courses?: AllCourses_courses[]
  loading: boolean
  title: string
  headerImage: any
  subtitle?: string
  backgroundColor: string
  hueRotateAngle: number
  brightness: number
  fontColor: string
  titleBackground: string
}

const CourseHighlights = (props: CourseHighlightsProps) => {
  const {
    courses,
    loading,
    title,
    headerImage,
    subtitle,
    backgroundColor,
    hueRotateAngle,
    brightness,
    fontColor,
    titleBackground,
  } = props

  return (
    <Root backgroundColor={backgroundColor}>
      <BackgroundImage
        src={headerImage}
        aria-hidden
        hueRotateAngle={hueRotateAngle}
        brightness={brightness}
      />

      <div style={{ zIndex: 20 }}>
        <H2Background
          component="h2"
          variant="h2"
          fontcolor={fontColor}
          titlebackground={titleBackground}
        >
          {title}
        </H2Background>
        {subtitle && (
          <SubtitleBackground
            component="div"
            variant="subtitle1"
            fontcolor={fontColor}
          >
            {subtitle}
          </SubtitleBackground>
        )}
      </div>
      <Container>
        <Grid container spacing={3}>
          {loading ? (
            <>
              <CourseCard key="skeletoncard1" />
              <CourseCard key="skeletoncard2" />
            </>
          ) : (
            courses?.map((course) => (
              <CourseCard key={`course-${course.id}`} course={course} />
            ))
          )}
        </Grid>
      </Container>
    </Root>
  )
}

export default CourseHighlights
