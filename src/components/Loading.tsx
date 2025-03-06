import { Box, CircularProgress, Typography } from "@mui/material"

export interface LoadingProps {
  msg?: string
}

export default function Loading({ msg }: LoadingProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        textAlign: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress size={60} />
      {!!msg &&
        <Typography sx={{ mt: 2, fontSize: "1.2rem", fontWeight: "bold", color: "text.secondary" }} children={msg} />
      }
    </Box>
  )
}
