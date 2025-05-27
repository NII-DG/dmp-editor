import { Box, Button } from "@mui/material"
import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { Link } from "react-router-dom"
import { useRecoilValueLoadable, useRecoilValue } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { listingProjects, ProjectInfo, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { authSelector, tokenAtom } from "@/store/token"
import { userSelector } from "@/store/user"

export default function Home() {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authSelector)
  const user = useRecoilValueLoadable(userSelector)
  const token = useRecoilValue(tokenAtom)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const isLogin = auth.state === "hasValue" && auth.contents
  const isLoading = user.state === "loading" || loadingProjects

  // Load projects
  useEffect(() => {
    if (token !== "") {
      setLoadingProjects(true)
      listingProjects(token)
        .then((projects) => {
          setProjects(projects.filter(project => project.title.startsWith(DMP_PROJECT_PREFIX)))
        })
        .catch(showBoundary)
        .finally(() => setLoadingProjects(false))
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <Frame noAuth>
        <Loading msg={"プロジェクト情報を取得中..."} />
      </Frame>
    )
  }

  return (
    <Frame>
      <Box sx={{ mt: "1rem" }}>
        <Button component={Link} to="/example/simple" variant="outlined">
          サンプルフォーム
        </Button>
      </Box>
      {isLogin
        ? <ProjectTable sx={{ mt: "1.5rem" }} user={user.contents!} projects={projects!} />
        : <LoginCard sx={{ mt: "1.5rem" }} />
      }
    </Frame>
  )
}
