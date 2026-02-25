import SaveOutlined from "@mui/icons-material/SaveOutlined"
import { Box, Typography, Button, Divider, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetadataSection from "@/components/EditProject/DmpMetadataSection"
import GrdmProject from "@/components/EditProject/GrdmProject"
import PersonInfoSection from "@/components/EditProject/PersonInfoSection"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import OurCard from "@/components/OurCard"
import { DmpFormValues, researchPhases } from "@/dmp"
import type { ResearchPhase } from "@/dmp"
import { ProjectInfo } from "@/grdmClient"
import { useSnackbar } from "@/hooks/useSnackbar"
import { useUpdateDmp } from "@/hooks/useUpdateDmp"
import { User } from "@/hooks/useUser"

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
  const { getValues, handleSubmit, formState, control, setValue, reset } = useFormContext<DmpFormValues>()
  const researchPhase = useWatch({ control, name: "dmp.metadata.researchPhase" }) as ResearchPhase
  const { isValid, isSubmitted } = formState
  const updateMutation = useUpdateDmp()
  const { showSnackbar } = useSnackbar()
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
          showSnackbar("DMPを保存しました", "success")
          if (isNew) {
            navigate(`/projects/${newProjectId}`)
          } else {
            reset(formValues)
          }
        },
        onError: () => {
          setSaveState("error")
          setTimeout(() => setSaveState("idle"), 2000)
          showSnackbar("保存に失敗しました", "error")
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
        <Box sx={{ mt: "1rem", display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem" }}>
          <Typography sx={{ fontSize: "0.9rem", fontWeight: "bold" }}>{"研究フェーズ:"}</Typography>
          <ToggleButtonGroup
            value={researchPhase}
            exclusive
            size="small"
            onChange={(_, value: ResearchPhase | null) => {
              if (value !== null) setValue("dmp.metadata.researchPhase", value)
            }}
          >
            {researchPhases.map((phase) => (
              <ToggleButton key={phase} value={phase} sx={{ textTransform: "none", px: "1.5rem" }}>
                {phase}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
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
    </OurCard>
  )
}
