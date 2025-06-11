import { useErrorBoundary } from "react-error-boundary"
import { useLocation, useNavigate } from "react-router-dom"
import { useRecoilState, useSetRecoilState } from "recoil"

import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import { useAuth } from "@/hooks/useAuth"
import { prevUrlAtom, tokenAtom } from "@/store/token"

interface AuthHelperProps {
  children: React.ReactNode
}

export default function AuthHelper({ children }: AuthHelperProps) {
  const { showBoundary } = useErrorBoundary()
  const navigate = useNavigate()
  const [token, setToken] = useRecoilState(tokenAtom)
  const location = useLocation()
  const currentPath = location.pathname
  const setPrevUrl = useSetRecoilState(prevUrlAtom)
  const { data: isAuth, isLoading, isError, error } = useAuth(token)

  if (isError && error) {
    showBoundary(error)
  }

  if (isLoading) {
    return (
      <Frame noAuth>
        <Loading msg="認証中..." />
      </Frame>
    )
  }

  if (isAuth === false) {
    if (currentPath !== "/") {
      setPrevUrl(currentPath)
    }
    if (token) {
      setToken("")
    }
    navigate("/")
  }

  return <>{children}</>
}
