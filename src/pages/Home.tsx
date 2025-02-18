import { Box, Container } from "@mui/material"

export default function Home() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1 }}>
        <h1>Home</h1>
      </Container>
    </Box>
  )
}
