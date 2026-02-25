import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { useParams } from "react-router-dom"

import ExportDmpCard from "@/components/EditProject/ExportDmpCard"
import FormCard from "@/components/EditProject/FormCard"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { initDmp, DmpFormValues } from "@/dmp"
import { useDmp } from "@/hooks/useDmp"
import { useProjectInfo } from "@/hooks/useProjectInfo"
import { useProjects } from "@/hooks/useProjects"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { useUser } from "@/hooks/useUser"

interface EditProjectProps {
  isNew?: boolean
}

export default function EditProject({ isNew = false }: EditProjectProps) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const dmpQuery = useDmp(projectId, isNew)
  const userQuery = useUser()
  const projectQuery = useProjectInfo(projectId, isNew)
  const projectsQuery = useProjects()

  const [formInitialized, setFormInitialized] = useState(false)
  const [minDelayComplete, setMinDelayComplete] = useState(false)

  useEffect(() => {
    if (!isNew) return
    const timer = setTimeout(() => setMinDelayComplete(true), 500)
    return () => clearTimeout(timer)
  }, [isNew])

  const loading = isNew
    ? !formInitialized || !minDelayComplete || userQuery.isLoading || projectsQuery.isLoading
    : dmpQuery.isLoading ||
      userQuery.isLoading ||
      projectQuery.isLoading ||
      projectsQuery.isLoading ||
      !userQuery.data ||
      !projectsQuery.data
  const error = dmpQuery.error || userQuery.error || projectQuery.error || projectsQuery.error

  const methods = useForm<DmpFormValues>({
    defaultValues: {
      grdmProjectName: "",
      dmp: initDmp(userQuery.data),
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  })

  // Initialize form values based on fetched data
  useEffect(() => {
    if (isNew) {
      if (userQuery.data && projectsQuery.data) {
        methods.reset({
          grdmProjectName: "",
          dmp: initDmp(userQuery.data),
        })
        setFormInitialized(true)
      }
    } else if (dmpQuery.data && userQuery.data && projectQuery.data) {
      methods.reset({
        grdmProjectName: projectQuery.data.title ?? "",
        dmp: dmpQuery.data,
      })
    }
  }, [isNew, methods, dmpQuery.data, userQuery.data, projectQuery.data, projectsQuery.data])

  const blocker = useUnsavedChangesWarning(methods.formState.isDirty)

  if (loading) {
    return (
      <Frame noAuth>
        <Loading msg="Loading..." />
      </Frame>
    )
  }

  if (error) throw error

  return (
    <Frame>
      <FormProvider {...methods}>
        <FormCard
          sx={{ mt: "1.5rem" }}
          isNew={isNew}
          user={userQuery.data!}
          project={projectQuery.data}
          projects={projectsQuery.data!}
        />
        <ExportDmpCard sx={{ mt: "1.5rem" }} />
      </FormProvider>

      <Dialog open={blocker.state === "blocked"} onClose={() => blocker.reset?.()}>
        <DialogTitle>{"未保存の変更があります"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {"保存せずにページを離れると、変更内容が失われます。続けますか？"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => blocker.reset?.()} color="primary">
            {"このページに留まる"}
          </Button>
          <Button onClick={() => blocker.proceed?.()} color="error" autoFocus>
            {"変更を破棄して離れる"}
          </Button>
        </DialogActions>
      </Dialog>
    </Frame>
  )
}
