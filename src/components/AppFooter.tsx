import { Box, Typography } from "@mui/material"
import { SxProps } from "@mui/system"

export interface AppFooterProps {
  sx?: SxProps
}

export default function AppFooter({ sx }: AppFooterProps) {
  return (
    <Box component="footer" sx={{ ...sx, margin: "1.5rem 0" }}>
      <Typography variant="body2" align="center" color="text.secondary"
        children={`© 2024-${new Date().getFullYear()} National Institute of Informatics.`}
      />
      <Typography variant="body2" align="center" color="text.secondary" sx={{ letterSpacing: "0.1rem" }}
        children={`DMP editor ${__APP_VERSION__}`}
      />
    </Box>
  )
}
