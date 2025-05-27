import { useErrorBoundary } from "react-error-boundary"
import { useNavigate } from "react-router-dom"
import { useRecoilState } from "recoil"

import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { useAuth } from "@/hooks/useAuth"
import { tokenAtom } from "@/store/token"

interface AuthHelperProps {
  children: React.ReactNode
}

export default function AuthHelper({ children }: AuthHelperProps) {
  const { showBoundary } = useErrorBoundary()
  const navigate = useNavigate()
  const [token, setToken] = useRecoilState(tokenAtom)
  const { data: isAuth, isLoading, isError, error } = useAuth(token)

  if (isError && error) {
    showBoundary(error)
    return null
  }

  if (isLoading) {
    return (
      <Frame noAuth>
        <Loading msg="認証中..." />
      </Frame>
    )
  }

  if (isAuth === false && token !== "") {
    setToken("")
    navigate("/")
  }

  return <>{children}</>
}
