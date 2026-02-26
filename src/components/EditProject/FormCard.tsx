import SaveOutlined from "@mui/icons-material/SaveOutlined"
import {
  Box,
  Button,
  Divider,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { FieldPath, useFormContext } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetaSection from "@/components/EditProject/DmpMetaSection"
import FileTreeSection from "@/components/EditProject/FileTreeSection"
import PersonInfoSection from "@/components/EditProject/PersonInfoSection"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import ProjectTableSection from "@/components/EditProject/ProjectTableSection"
import OurCard from "@/components/OurCard"
import { DmpFormValues } from "@/dmp"
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

const STEPS = [
  { label: "基本設定" },
  { label: "プロジェクト情報" },
  { label: "担当者情報" },
  { label: "研究データ情報" },
  { label: "GRDM 連携" },
] as const

const STEP_FIELDS: Record<number, FieldPath<DmpFormValues>[]> = {
  0: [
    "grdmProjectName",
    "dmp.metadata.revisionType",
    "dmp.metadata.submissionDate",
    "dmp.metadata.dateCreated",
    "dmp.metadata.dateModified",
  ],
  1: [
    "dmp.projectInfo.fundingAgency",
    "dmp.projectInfo.projectCode",
    "dmp.projectInfo.projectName",
  ],
  2: [], // PersonInfoSection: validated individually in dialog
  3: [], // DataInfoSection: validated individually in dialog
  4: [], // GRDM connection: no validation required
}

export default function FormCard({ sx, isNew = false, user, project, projects }: FormCardProps) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { getValues, handleSubmit, formState, reset, trigger, setError } = useFormContext<DmpFormValues>()
  const { isValid, isSubmitted } = formState
  const updateMutation = useUpdateDmp()
  const { showSnackbar } = useSnackbar()
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [activeStep, setActiveStep] = useState(0)

  const onSubmit = async () => {
    // grdmProjectName Controller is only mounted at Step 0, so handleSubmit does not
    // validate it when saving from another step. Validate manually before proceeding.
    if (isNew && !getValues("grdmProjectName")?.trim()) {
      setError("grdmProjectName", { type: "required", message: "プロジェクト名は必須です" })
      setActiveStep(0)
      return
    }

    const formValues = getValues()
    setSaveState("saving")

    updateMutation.mutate(
      { projectId, isNew, formValues },
      {
        onSuccess: (newProjectId: string) => {
          setSaveState("saved")
          setTimeout(() => setSaveState("idle"), 2000)
          showSnackbar("DMPを保存しました", "success")
          // reset() updates the RHF live store (isDirty = false) synchronously.
          // The useBlocker in EditProject reads from the live store via a stable
          // ref function, so navigate() called right after is not blocked.
          reset(formValues)
          const targetProjectId = isNew ? newProjectId : projectId
          if (activeStep === STEPS.length - 1) {
            // Last step: navigate to detail page for both new and existing projects
            navigate(`/projects/${targetProjectId}/detail`)
          } else if (isNew) {
            // Other steps with a new project: navigate to the edit page
            navigate(`/projects/${newProjectId}`)
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

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep]
    const valid = fields.length > 0 ? await trigger(fields) : true
    if (valid) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
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
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography
          sx={{ fontSize: "1.5rem" }}
          component="h1"
          children={isNew ? "DMP Project の新規作成" : "DMP Project の編集"}
        />

        <Stepper activeStep={activeStep} alternativeLabel nonLinear sx={{ mt: "1.5rem" }}>
          {STEPS.map((step, i) => (
            <Step key={step.label} completed={i < activeStep}>
              <StepButton onClick={() => setActiveStep(i)}>{step.label}</StepButton>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: "2rem" }}>
          {activeStep === 0 && (
            <DmpMetaSection isNew={isNew} project={project} projects={projects} />
          )}
          {activeStep === 1 && <ProjectInfoSection />}
          {activeStep === 2 && <PersonInfoSection />}
          {activeStep === 3 && <DataInfoSection user={user} projects={projects} />}
          {activeStep === 4 && (
            <>
              <ProjectTableSection user={user} projects={projects} />
              <Divider sx={{ my: "1.5rem" }} />
              <FileTreeSection projects={projects} />
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", mt: "2rem", alignItems: "center" }}>
          <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>
            前へ
          </Button>
          {activeStep < STEPS.length - 1 && (
            <Button variant="contained" onClick={handleNext}>
              次へ
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {(!isNew || activeStep === STEPS.length - 1) && (
            <Button
              variant="contained"
              color="secondary"
              type="submit"
              sx={{ textTransform: "none", width: "180px" }}
              startIcon={<SaveOutlined />}
              disabled={isButtonDisabled()}
            >
              {buttonLabel()}
            </Button>
          )}
        </Box>
      </Box>
    </OurCard>
  )
}
