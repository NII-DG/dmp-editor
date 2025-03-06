import { Box, Container } from "@mui/material"

import AppFooter from "@/components/AppFooter"
import AppHeader from "@/components/AppHeader"
import AppHeaderBase from "@/components/AppHeaderBase"

interface FrameProps {
  children: React.ReactNode
  noAuth?: boolean
}

export default function Frame({ children, noAuth }: FrameProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {noAuth ?
        <AppHeaderBase /> :
        <AppHeader />
      }
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1 }}>
        {children}
      </Container>
      <AppFooter />
    </Box>
  )
}
