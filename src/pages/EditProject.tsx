import { useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { useParams } from "react-router-dom"

import ExportDmpCard from "@/components/EditProject/ExportDmpCard"
import FormCard from "@/components/EditProject/FormCard"
import GrdmCard from "@/components/EditProject/GrdmCard"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { initDmp, DmpFormValues } from "@/dmp"
import { useDmp } from "@/hooks/useDmp"
import { useProjectInfo } from "@/hooks/useProjectInfo"
import { useProjects } from "@/hooks/useProjects"
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

  const loading = dmpQuery.isLoading || userQuery.isLoading || projectQuery.isLoading || projectsQuery.isLoading
  const error = dmpQuery.error || userQuery.error || projectQuery.error || projectsQuery.error

  const methods = useForm<DmpFormValues>({
    defaultValues: {
      grdmProjectName: "",
      dmp: initDmp(userQuery.data),
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  })

  // Initialize default values based on the fetched data
  useEffect(() => {
    if (dmpQuery.data && userQuery.data && projectQuery.data) {
      const defaultValues = {
        grdmProjectName: projectQuery.data?.title ?? "",
        dmp: isNew ? initDmp(userQuery.data) : dmpQuery.data,
      }
      methods.reset(defaultValues)
    }
  }, [isNew, methods, dmpQuery.data, userQuery.data, projectQuery.data])

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
          project={projectQuery.data}
          projects={projectsQuery.data!}
        />
        <GrdmCard sx={{ mt: "1.5rem" }} user={userQuery.data!} projects={projectsQuery.data!} />
        <ExportDmpCard sx={{ mt: "1.5rem" }} />
      </FormProvider>
    </Frame>
  )
}
