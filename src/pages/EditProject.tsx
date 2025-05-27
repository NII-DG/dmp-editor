import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useRecoilValue, useSetRecoilState } from "recoil"

import ExportDmpCard from "@/components/EditProject/ExportDmpCard"
import FormCard from "@/components/EditProject/FormCard"
import GrdmCard from "@/components/EditProject/GrdmCard"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { initDmp, Dmp } from "@/dmp"
import { getProjectInfo, readDmpFile, ProjectInfo, FilesNode } from "@/grdmClient"
import { useUser } from "@/hooks/useUser"
import {
  dmpAtom,
  grdmProjectNameAtom,
  formTouchedStateAtom,
  initFormTouchedState,
  isNewAtom,
} from "@/store/dmp"
import { tokenAtom } from "@/store/token"

interface EditProjectProps {
  isNew?: boolean
}

export default function EditProject({ isNew }: EditProjectProps) {
  const navigate = useNavigate()
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId!
  const token = useRecoilValue(tokenAtom)
  const userQuery = useUser(token)

  const setDmp = useSetRecoilState(dmpAtom)
  const setGrdmProjectName = useSetRecoilState(grdmProjectNameAtom)
  const setFormTouched = useSetRecoilState(formTouchedStateAtom)
  const setIsNew = useSetRecoilState(isNewAtom)

  // Initialize for new project
  useEffect(() => {
    if (isNew) {
      setDmp(initDmp())
      setGrdmProjectName("")
      setFormTouched(initFormTouchedState())
      setIsNew(true)
    }
  }, [isNew, setDmp, setGrdmProjectName, setFormTouched, setIsNew])

  // Fetch project information
  const projectQuery = useQuery<ProjectInfo, Error, ProjectInfo>({
    queryKey: ["projectInfo", token, projectId],
    queryFn: () => getProjectInfo(token, projectId),
    enabled: !isNew && Boolean(token),
  })

  useEffect(() => {
    if (projectQuery.data) {
      setGrdmProjectName(projectQuery.data.title)
    }
  }, [projectQuery.data, setGrdmProjectName])

  // Fetch DMP file
  const dmpQuery = useQuery<{ dmp: Dmp; node: FilesNode }, Error, { dmp: Dmp; node: FilesNode }>({
    queryKey: ["dmpFile", token, projectId],
    queryFn: () => readDmpFile(token, projectId),
    enabled: Boolean(projectQuery.data) && !isNew,
  })

  useEffect(() => {
    if (dmpQuery.data) {
      setDmp(dmpQuery.data.dmp)
      setIsNew(false)
    }
  }, [dmpQuery.data, setDmp, setIsNew])

  // Consolidate data fetching states
  const loading = userQuery.isLoading || projectQuery.isLoading || dmpQuery.isLoading

  const error = userQuery.error || projectQuery.error || dmpQuery.error

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
      <FormCard
        sx={{ mt: "1.5rem" }}
        isNew={!!isNew}
        projectId={projectId}
        user={userQuery.data}
        project={projectQuery.data!}
      />
      <GrdmCard sx={{ mt: "1.5rem" }} user={userQuery.data} />
      <ExportDmpCard sx={{ mt: "1.5rem" }} />
    </Frame>
  )
}
