import { Box, Button } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useRecoilValue } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { listingProjects, ProjectInfo, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { useAuth } from "@/hooks/useAuth"
import { useUser } from "@/hooks/useUser"
import { tokenAtom } from "@/store/token"

export default function Home() {
  const token = useRecoilValue(tokenAtom)
  const auth = useAuth(token)
  const userQuery = useUser(token)
  const projectsQuery = useQuery<ProjectInfo[], Error, ProjectInfo[]>({
    queryKey: ["projects", token],
    queryFn: () =>
      listingProjects(token).then((list) =>
        list.filter((p) => p.title.startsWith(DMP_PROJECT_PREFIX)),
      ),
    enabled: Boolean(auth.data),
  })

  const loading = auth.isLoading || userQuery.isLoading || projectsQuery.isLoading
  const error = auth.error || userQuery.error || projectsQuery.error

  if (loading) {
    return (
      <Frame noAuth>
        <Loading msg="Loading..." />
      </Frame>
    )
  }

  if (error) {
    throw error
  }

  if (!auth.data) {
    return (
      <Frame>
        <LoginCard sx={{ mt: "1.5rem" }} />
      </Frame>
    )
  }

  return (
    <Frame>
      <Box sx={{ mt: "1rem" }}>
        <Button component={Link} to="/projects/new" variant="contained">
          新規作成
        </Button>
      </Box>
      <ProjectTable
        sx={{ mt: "1.5rem" }}
        user={userQuery.data!}
        projects={projectsQuery.data!}
      />
    </Frame>
  )
}
