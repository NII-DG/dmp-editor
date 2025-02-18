import { Box } from "@mui/material"

interface ErrorPageProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      error page
    </Box>
  )
}
