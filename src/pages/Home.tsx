import { useRecoilValue } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { useAuth } from "@/hooks/useAuth"
import { useDmpProjects } from "@/hooks/useDmpProjects"
import { useUser } from "@/hooks/useUser"
import { tokenAtom } from "@/store/token"

export default function Home() {
  const token = useRecoilValue(tokenAtom)
  const auth = useAuth(token)
  const userQuery = useUser()
  const projectsQuery = useDmpProjects()

  const loading = auth.isLoading || userQuery.isLoading || projectsQuery.isLoading
  const error = auth.error || userQuery.error || projectsQuery.error

  if (loading) {
    return (
      <Frame noAuth>
        <Loading msg="Loading..." />
      </Frame>
    )
  }

  if (error) throw error

  if (!auth.data) {
    return (
      <Frame>
        <LoginCard sx={{ mt: "1.5rem" }} />
      </Frame>
    )
  }

  return (
    <Frame>
      <ProjectTable
        sx={{ mt: "1.5rem" }}
        user={userQuery.data!}
        projects={projectsQuery.data!}
      />
    </Frame>
  )
}
