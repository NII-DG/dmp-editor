import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValueLoadable, useRecoilValue } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { listingProjects, ProjectInfo, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { authenticatedSelector, tokenAtom } from "@/store/token"
import { userSelector } from "@/store/user"

export default function Home() {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authenticatedSelector)
  const user = useRecoilValueLoadable(userSelector)
  const token = useRecoilValue(tokenAtom)
  const [projects, setProjects] = useState<ProjectInfo[] | undefined>(undefined)

  const isLogin = (auth.state === "hasValue" && !!auth.contents) &&
    (user.state === "hasValue" && !!user.contents)
  const loadingData = projects === undefined

  // Load projects
  useEffect(() => {
    if (isLogin) {
      listingProjects(token).then((projects) => {
        setProjects(projects.filter(project => project.title.startsWith(DMP_PROJECT_PREFIX)))
      }).catch((error) => {
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

  return (
    <Frame>
      {isLogin
        ? <ProjectTable sx={{ mt: "1.5rem" }} user={user.contents!} projects={projects!} />
        : <LoginCard sx={{ mt: "1.5rem" }} />
      }
    </Frame>
  )
}
