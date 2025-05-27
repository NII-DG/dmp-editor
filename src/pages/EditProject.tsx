import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useParams } from "react-router"
import { useRecoilValue, useRecoilValueLoadable, useSetRecoilState } from "recoil"

import ExportDmpCard from "@/components/EditProject/ExportDmpCard"
import FormCard from "@/components/EditProject/FormCard"
import GrdmCard from "@/components/EditProject/GrdmCard"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import NoAuthCard from "@/components/NoAuthCard"
import { initDmp } from "@/dmp"
import { FilesNode, ProjectInfo, getProjectInfo, readDmpFile } from "@/grdmClient"
import { dmpAtom, formTouchedStateAtom, grdmProjectNameAtom, initFormTouchedState, isNewAtom } from "@/store/dmp"
import { authSelector, tokenAtom } from "@/store/token"
import { userSelector } from "@/store/user"

interface EditProjectProps {
  isNew?: boolean
}

export default function EditProject({ isNew }: EditProjectProps) {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authSelector)
  const user = useRecoilValueLoadable(userSelector)
  const token = useRecoilValue(tokenAtom)
  const projectId = useParams<{ projectId: string }>().projectId!
  const [project, setProject] = useState<ProjectInfo | undefined>(undefined)
  const [dmpFileNode, setDmpFileNode] = useState<FilesNode | undefined>(undefined)
  const setDmp = useSetRecoilState(dmpAtom)
  const setGrdmProjectName = useSetRecoilState(grdmProjectNameAtom)
  const setFormTouchedState = useSetRecoilState(formTouchedStateAtom)
  const setIsNew = useSetRecoilState(isNewAtom)

  const isLogin = auth.state === "hasValue" && auth.contents
  const loadingData = user.state !== "hasValue" ||
    (!isNew && (project === undefined || dmpFileNode === undefined))

  // Load project info and DMP file
  useEffect(() => {
    if (isNew) {
      // Initialize form state
      setDmp(initDmp())
      setGrdmProjectName("")
      setFormTouchedState(initFormTouchedState())
      setIsNew(true)
    } else {
      setGrdmProjectName("")
      setFormTouchedState(initFormTouchedState())
      setIsNew(false)
      if (token) {
        getProjectInfo(token, projectId)
          .then((project) => {
            setProject(project)
            readDmpFile(token, projectId)
              .then(({ dmp, node }) => {
                setDmp(dmp)
                setDmpFileNode(node)
              })
              .catch(showBoundary)
          })
          .catch(showBoundary)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLogin) {
    return (
      <Frame noAuth>
        <NoAuthCard sx={{ mt: "1.5rem" }} />
      </Frame>
    )
  }

  if (loadingData) {
    return (
      <Frame noAuth>
        <Loading msg={"プロジェクト情報を取得中..."} />
      </Frame>
    )
  }

  return (
    <Frame>
      <FormCard
        sx={{ mt: "1.5rem" }}
        isNew={!!isNew}
        projectId={projectId}
        user={user.contents!}
        project={project}
      />
      <GrdmCard
        sx={{ mt: "1.5rem" }}
        user={user.contents!}
      />
      <ExportDmpCard sx={{ mt: "1.5rem" }} />
    </Frame>
  )
}
