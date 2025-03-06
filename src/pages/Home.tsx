import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValueLoadable } from "recoil"

import Frame from "@/components/Frame"
import LoginCard from "@/components/Home/LoginCard"
import ProjectTable from "@/components/Home/ProjectTable"
import Loading from "@/components/Loading"
import { authenticatedSelector } from "@/store/token"
import { userSelector } from "@/store/user"

export default function Home() {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authenticatedSelector)
  const user = useRecoilValueLoadable(userSelector)
  const isLogin = (auth.state === "hasValue" && !!auth.contents) &&
    (user.state === "hasValue" && !!user.contents)

  if (auth.state === "hasError") showBoundary(auth.contents)
  if (user.state === "hasError") showBoundary(user.contents)

  if (!isLogin) {
    return (
      <Frame noAuth>
        <Loading msg="認証中..." />
      </Frame>
    )
  }

  return (
    <Frame>
      {isLogin
        ? <ProjectTable sx={{ mt: "1.5rem" }} user={user.contents!} />
        : <LoginCard sx={{ mt: "1.5rem" }} />
      }
    </Frame>
  )
}
