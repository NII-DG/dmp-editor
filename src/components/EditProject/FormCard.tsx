import { Box, Typography, Button, Divider } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useNavigate } from "react-router"
import { useRecoilValue, useSetRecoilState } from "recoil"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetadataSection from "@/components/EditProject/DmpMetadataSection"
import GrdmProject from "@/components/EditProject/GrdmProject"
import PersonInfoSection from "@/components/EditProject/PersonInfoSection"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import OurCard from "@/components/OurCard"
import { writeDmpFile, createProject, DMP_PROJECT_PREFIX, ProjectInfo } from "@/grdmClient"
import { dmpAtom, formValidSelector, projectNameAtom, submitTriggerAtom } from "@/store/dmp"
import { tokenAtom } from "@/store/token"
import { User } from "@/store/user"

export interface FormCardProps {
  sx?: SxProps
  isNew: boolean
  projectId: string
  user: User
  project?: ProjectInfo
}

// Called after authentication
export default function FormCard({ sx, isNew, projectId, user, project }: FormCardProps) {
  const navigate = useNavigate()
  const { showBoundary } = useErrorBoundary()
  const token = useRecoilValue(tokenAtom)
  const projectName = useRecoilValue(projectNameAtom) // No prefix
  const dmp = useRecoilValue(dmpAtom)
  const isFormValid = useRecoilValue(formValidSelector)
  const setSubmitTrigger = useSetRecoilState(submitTriggerAtom)
  const [submitRequested, setSubmitRequested] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSave = () => {
    setSubmitTrigger((prev) => prev + 1)
    setTimeout(() => {
      setSubmitRequested(true)
    }, 500)
  }

  useEffect(() => {
    if (!submitRequested) return
    if (!isFormValid) {
      setSubmitRequested(false)
      return
    }

    setSubmitting(true)

    if (isNew) {
      createProject(token, `${DMP_PROJECT_PREFIX}${projectName}`)
        .then((project) => {
          writeDmpFile(token, project.id, dmp)
            .then(() => {
              setSubmitting(false)
              navigate(`/projects/${project.id}`)
            })
            .catch((error) => {
              setSubmitting(false)
              showBoundary(error)
            })
        })
        .catch((error) => {
          setSubmitting(false)
          showBoundary(error)
        })
    } else {
      writeDmpFile(token, projectId, dmp)
        .then(() => {
          setSubmitting(false)
        })
        .catch((error) => {
          setSubmitting(false)
          showBoundary(error)
        })
    }

    setSubmitRequested(false)
  }, [submitRequested]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children={isNew ? "DMP Project の新規作成" : "DMP Project の編集"}
      />
      <GrdmProject sx={{ mt: "1rem" }} isNew={isNew} project={project} />
      <Divider sx={{ my: "1.5rem" }} />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <DmpMetadataSection />
        <Divider sx={{ my: "1.5rem" }} />
        <ProjectInfoSection />
        <Divider sx={{ my: "1.5rem" }} />
        <PersonInfoSection isNew={isNew} user={user} />
        <Divider sx={{ my: "1.5rem" }} />
        <DataInfoSection isNew={isNew} />
      </Box>
      <Divider sx={{ my: "1.5rem" }} />
      <Box sx={{ display: "flex", flexDirection: "row", mt: "1.5rem" }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSave}
          sx={{
            textTransform: "none",
            width: "160px",
          }}
          children="GRDM に保存する"
          disabled={!isFormValid || submitting}
        />
      </Box>
    </OurCard>
  )
}
