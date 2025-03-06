import { Box, Typography, TextField } from "@mui/material"
import { SxProps } from "@mui/system"

import OurCard from "@/components/OurCard"

export interface FormCardProps {
  sx?: SxProps
}

export default function FormCard({ sx }: FormCardProps) {
  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children="DMP Project の編集"
      />
      <Typography sx={{ mt: "0.5rem" }}>
        {"入力フォームを書いていく"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1.5rem", mt: "1.5rem" }}>
        <label>プロジェクト名</label>
        <TextField>
        </TextField>
      </Box>
    </OurCard>
  )
}
