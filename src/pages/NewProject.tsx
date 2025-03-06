import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValueLoadable } from "recoil"

import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import FormCard from "@/components/NewProject/FormCard"
import NoAuthCard from "@/components/NoAuthCard"
import { authenticatedSelector } from "@/store/token"

export default function NewProject() {
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

  if (auth.contents === false) {
    return (
      <Frame noAuth>
        <NoAuthCard sx={{ mt: "1.5rem" }} />
      </Frame>
    )
  }

  return (
    <Frame>
      <FormCard sx={{ mt: "1.5rem" }} />
    </Frame>
  )
}
