import { useErrorBoundary } from "react-error-boundary"
import { useRecoilState, useRecoilValueLoadable } from "recoil"

import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { authSelector, tokenAtom } from "@/store/token"

interface AuthHelper {
  children: React.ReactNode
}

export default function AuthHelper({ children }: AuthHelper) {
  const { showBoundary } = useErrorBoundary()
  const auth = useRecoilValueLoadable(authSelector)
  const [token, setToken] = useRecoilState(tokenAtom)

  if (auth.state === "hasError") showBoundary(auth.contents)

  if (auth.state === "loading") {
    return (
      <Frame noAuth>
        <Loading msg="認証中..." />
      </Frame>
    )
  }

  if (auth.state === "hasValue" && !auth.contents && token !== "") {
    setToken("")
  }

  return <>{children}</>
}
