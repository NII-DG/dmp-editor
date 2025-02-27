import { Box, Container, Typography } from "@mui/material"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValueLoadable } from "recoil"

import AppFooter from "@/components/AppFooter"
import AppHeader from "@/components/AppHeader"
import AppHeaderBase from "@/components/AppHeaderBase"
import LoginCard from "@/components/Home/LoginCard"
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
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <AppHeaderBase />
        <Container component="main" maxWidth="lg" sx={{ flexGrow: 1 }} >
          <Loading msg="認証中..." />
        </Container>
        <AppFooter />
      </Box >
    )
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppHeader />
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1 }} >
        {(auth.state === "hasValue" && auth.contents)
          ? <Typography variant="h4" children="認証済み" />
          : <LoginCard sx={{ mt: "1.5rem" }} />
        }
      </Container>
      <AppFooter />
    </Box >
  )
}
