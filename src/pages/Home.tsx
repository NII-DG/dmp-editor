import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValueLoadable } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { authenticatedSelector } from "@/store/token"

export default function Home() {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authenticatedSelector)

  if (auth.state === "hasError") {
    showBoundary(auth.contents)
  }

  if (auth.state === "loading") {
    return (
      <Frame noAuth>
        <Loading msg="認証中..." />
      </Frame>
    )
  }

  return (
    <Frame>
      {(auth.state === "hasValue" && !!auth.contents)
        ? <ProjectTable sx={{ mt: "1.5rem" }} />
        : <LoginCard sx={{ mt: "1.5rem" }} />
      }
    </Frame>
  )
}
