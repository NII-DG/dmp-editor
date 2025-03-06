import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useParams } from "react-router"
import { useRecoilValue, useRecoilValueLoadable, useSetRecoilState } from "recoil"

import FormCard from "@/components/EditProject/FormCard"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import NoAuthCard from "@/components/NoAuthCard"
import { FilesNode, ProjectInfo, getProjectInfo, readDmpFile } from "@/grdmClient"
import { dmpAtom } from "@/store/dmp"
import { authenticatedSelector, tokenAtom } from "@/store/token"
import { userSelector } from "@/store/user"

interface EditProjectProps {
  isNew?: boolean
}

export default function EditProject({ isNew }: EditProjectProps) {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authenticatedSelector)
  const user = useRecoilValueLoadable(userSelector)
  const projectId = useParams<{ projectId: string }>().projectId!
  const token = useRecoilValue(tokenAtom)
  const [project, setProject] = useState<ProjectInfo | undefined>(undefined)
  const [dmpFileNode, setDmpFileNode] = useState<FilesNode | undefined>(undefined)
  const setDmp = useSetRecoilState(dmpAtom)

  const isLogin = (auth.state === "hasValue" && !!auth.contents) &&
    (user.state === "hasValue" && !!user.contents)
  const loadingData = !isNew && (project === undefined || dmpFileNode === undefined)

  // Load project info and DMP file
  useEffect(() => {
    if (!isNew && isLogin) {
      getProjectInfo(token, projectId)
        .then((project) => {
          setProject(project)
          readDmpFile(token, projectId)
            .then(({ dmp, node }) => {
              setDmp(dmp)
              setDmpFileNode(node)
            })
            .catch((error) => {
              showBoundary(error)
            })
        })
        .catch((error) => {
          showBoundary(error)
        })
    }
  }, [isLogin]) // eslint-disable-line react-hooks/exhaustive-deps

  if (auth.state === "hasError") showBoundary(auth.contents)
  if (user.state === "hasError") showBoundary(user.contents)

  if (!isLogin || loadingData) {
    return (
      <Frame noAuth>
        <Loading msg={!isLogin ?
          "認証中..." :
          "プロジェクト情報を取得中..."
        } />
      </Frame>
    )
  }

  if (auth.contents === false) {
    return (
      <Frame noAuth>
        <NoAuthCard sx={{ mt: "1.5rem" }} />
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
    </Frame>
  )
}
