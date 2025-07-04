import { SaveOutlined } from "@mui/icons-material"
import { Box, Typography, Button, Divider, Alert, Snackbar } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetadataSection from "@/components/EditProject/DmpMetadataSection"
import GrdmProject from "@/components/EditProject/GrdmProject"
import PersonInfoSection from "@/components/EditProject/PersonInfoSection"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import OurCard from "@/components/OurCard"
import { DmpFormValues } from "@/dmp"
import { ProjectInfo } from "@/grdmClient"
import { useUpdateDmp } from "@/hooks/useUpdateDmp"
import { User } from "@/hooks/useUser"
import { getErrorChain } from "@/utils"

export interface FormCardProps {
  sx?: SxProps
  isNew: boolean
  user: User
  project?: ProjectInfo | null
  projects: ProjectInfo[]
}

type SaveState = "idle" | "saving" | "saved" | "error"

export default function FormCard({ sx, isNew = false, user, project, projects }: FormCardProps) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { getValues, handleSubmit, formState } = useFormContext<DmpFormValues>()
  const { isValid, isSubmitted } = formState
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const snackbarOpen = alertMessage !== null
  const updateMutation = useUpdateDmp()
  // const [isMutating, setIsMutating] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")

  const onSubmit = async () => {
    const formValues = getValues()
    setSaveState("saving")

    updateMutation.mutate(
      { projectId, isNew, formValues },
      {
        onSuccess: (newProjectId: string) => {
          setSaveState("saved")
          setTimeout(() => setSaveState("idle"), 2000)
          if (isNew) navigate(`/projects/${newProjectId}`)
        },
        onError: (error: unknown) => {
          setSaveState("error")
          setTimeout(() => setSaveState("idle"), 2000)
          const messages = getErrorChain(error).map((e) => e.message)
          if (messages.some((msg) => msg.includes("HTTP Error: 403"))) {
            setAlertMessage(
              "GRDM Token に、プロジェクトを作成する権限 (\"osf.full_write\") が存在しないようです。ご確認よろしくお願いします。",
            )
          } else {
            setAlertMessage(`DMP の更新に失敗しました: ${messages.join(", ")}`)
          }
        },
      },
    )
  }

  const buttonLabel = () => {
    if (saveState === "saving") return "保存中"
    if (saveState === "saved") return "保存しました"
    if (saveState === "error") return "保存に失敗"
    return "GRDM に保存する"
  }
  const isButtonDisabled = () => {
    if (saveState === "saving" || saveState === "saved" || saveState === "error") return true
    return isSubmitted && !isValid
  }

  return (
    <OurCard sx={sx}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Typography
          sx={{ fontSize: "1.5rem" }}
          component="h1"
          children={isNew ? "DMP Project の新規作成" : "DMP Project の編集"}
        />
        <GrdmProject sx={{ mt: "1rem" }} isNew={isNew} project={project} projects={projects} />
        <Divider sx={{ my: "1.5rem" }} />
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <DmpMetadataSection />
          <Divider sx={{ my: "1.5rem" }} />
          <ProjectInfoSection />
          <Divider sx={{ my: "1.5rem" }} />
          <PersonInfoSection />
          <Divider sx={{ my: "1.5rem" }} />
          <DataInfoSection user={user} projects={projects} />
        </Box>
        <Divider sx={{ my: "1.5rem" }} />
        <Box sx={{ display: "flex", flexDirection: "row", mt: "1.5rem" }}>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            sx={{
              textTransform: "none",
              width: "180px",
            }}
            children={buttonLabel()}
            disabled={isButtonDisabled()}
            startIcon={<SaveOutlined />}
          />
        </Box>
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
