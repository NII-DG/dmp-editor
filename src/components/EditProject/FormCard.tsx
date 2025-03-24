import { SaveOutlined } from "@mui/icons-material"
import { Box, Typography, Button, Divider, Alert, Snackbar } from "@mui/material"
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
import { dmpAtom, formTouchedStateAtom, formValidState, initFormTouchedState, grdmProjectNameAtom } from "@/store/dmp"
import { tokenAtom } from "@/store/token"
import { User } from "@/store/user"
import { getErrorChain } from "@/utils"

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
  const grdmProjectName = useRecoilValue(grdmProjectNameAtom) // No prefix
  const dmp = useRecoilValue(dmpAtom)
  const setTouched = useSetRecoilState(formTouchedStateAtom)
  const isFormValid = useRecoilValue(formValidState)
  const [submitTrigger, setSubmitTrigger] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const snackbarOpen = alertMessage !== null

  const handleSave = () => {
    setTouched(initFormTouchedState(true))
    setSubmitTrigger(true)
  }

  useEffect(() => {
    // Use useEffect to re-evaluate the form validation (isFormValid) when submitTrigger changes
    if (!submitTrigger) return

    if (isFormValid) {
      setSubmitting(true)
      if (isNew) {
        createProject(token, `${DMP_PROJECT_PREFIX}${grdmProjectName}`)
          .then((project) => {
            writeDmpFile(token, project.id, dmp)
              .then(() => navigate(`/projects/${project.id}`))
              .catch(showBoundary)
          })
          .catch((error) => {
            const errorMessages = getErrorChain(error).map((err) => err.message)
            if (errorMessages.some((msg) => msg.includes("HTTP Error: 403"))) {
              setAlertMessage("GRDM Token に、プロジェクトを作成する権限 (\"osf.full_write\") が存在しないようです。ご確認よろしくお願いします。")
            } else {
              showBoundary(error)
            }
          })
          .finally(() => setSubmitting(false))
      } else {
        writeDmpFile(token, projectId, dmp)
          .then(() => navigate(`/projects/${projectId}`))
          .catch(showBoundary)
          .finally(() => setSubmitting(false))
      }
    }
    setSubmitTrigger(false)
  }, [submitTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

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
            width: "180px",
          }}
          children="GRDM に保存する"
          disabled={!isFormValid || submitting}
          startIcon={<SaveOutlined />}
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={10000}
      >
        <Alert onClose={() => setAlertMessage(null)} severity="error" sx={{ width: "100%" }} children={alertMessage} />
      </Snackbar>
    </OurCard>
  )
}
