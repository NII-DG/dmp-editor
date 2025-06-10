import { SaveOutlined } from "@mui/icons-material"
import {
  Box,
  Typography,
  Button,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material"
import { SxProps } from "@mui/system"
import React from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useForm, Controller, FormProvider } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useRecoilValue, useSetRecoilState } from "recoil"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetadataSection from "@/components/EditProject/DmpMetadataSection"
import GrdmProject from "@/components/EditProject/GrdmProject"
import PersonInfoSection from "@/components/EditProject/PersonInfoSection"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import OurCard from "@/components/OurCard"
import { Dmp } from "@/dmp"
import {
  writeDmpFile,
  createProject,
  DMP_PROJECT_PREFIX,
  ProjectInfo,
} from "@/grdmClient"
import { dmpAtom, grdmProjectNameAtom } from "@/store/dmp"
import { tokenAtom } from "@/store/token"
import { getErrorChain } from "@/utils"

export interface FormCardProps {
  sx?: SxProps
  isNew: boolean
  projectId: string
  project?: ProjectInfo
}

export default function FormCard({
  sx,
  isNew,
  projectId,
  project,
}: FormCardProps) {
  const navigate = useNavigate()
  const { showBoundary } = useErrorBoundary()
  const token = useRecoilValue(tokenAtom)
  const grdmProjectName = useRecoilValue(grdmProjectNameAtom)
  const setDmp = useSetRecoilState(dmpAtom)

  const methods = useForm<Dmp>({
    defaultValues: useRecoilValue(dmpAtom),
    mode: "onChange",
  })
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = methods

  const [alertMessage, setAlertMessage] = React.useState<string | null>(null)
  const snackbarOpen = alertMessage !== null

  const onSubmit = async (values: Dmp) => {
    try {
      setDmp(values)
      if (isNew) {
        const newProj = await createProject(
          token,
          `${DMP_PROJECT_PREFIX}${grdmProjectName}`,
        )
        await writeDmpFile(token, newProj.id, values)
        navigate(`/projects/${newProj.id}`)
      } else {
        await writeDmpFile(token, projectId, values)
        navigate(`/projects/${projectId}`)
      }
    } catch (error: unknown) {
      const msgs = getErrorChain(error).map((e) => e.message)
      if (msgs.some((m) => m.includes("HTTP Error: 403"))) {
        setAlertMessage(
          "GRDM Token にプロジェクト作成権限 (\"osf.full_write\") がありません。",
        )
      } else {
        showBoundary(error)
      }
    }
  }

  return (
    <FormProvider {...methods}>
      <OurCard sx={{ ...sx }}>
        <Typography sx={{ fontSize: "1.5rem" }} component="h1">
          {isNew ? "DMP Project の新規作成" : "DMP Project の編集"}
        </Typography>
        <GrdmProject sx={{ mt: "1rem" }} isNew={isNew} project={project} />
        <Divider sx={{ my: "1.5rem" }} />
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="metadata"
            control={control}
            render={({ field }) => <DmpMetadataSection {...field} />}
          />
          <Divider sx={{ my: "1.5rem" }} />
          <Controller
            name="projectInfo"
            control={control}
            render={({ field }) => <ProjectInfoSection {...field} />}
          />
          <Divider sx={{ my: "1.5rem" }} />
          <PersonInfoSection />
          <Divider sx={{ my: "1.5rem" }} />
          <DataInfoSection />
          <Divider sx={{ my: "1.5rem" }} />
          <Box sx={{ display: "flex", gap: 2, mt: "1.5rem" }}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={!isValid}
              startIcon={<SaveOutlined />}
              sx={{ textTransform: "none", width: "180px" }}
            >
              GRDM に保存する
            </Button>
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen}
          onClose={() => setAlertMessage(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          autoHideDuration={10000}
        >
          <Alert
            onClose={() => setAlertMessage(null)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </OurCard>
    </FormProvider>
  )
}
