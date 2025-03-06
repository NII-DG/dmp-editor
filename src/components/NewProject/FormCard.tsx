import { Box, Typography, TextField, Button } from "@mui/material"
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
        children="DMP Project の新規作成"
      />
      <Typography sx={{ mt: "0.5rem" }}>
        {"入力フォームを書いていく"}
        {"DMP の出力を別 card にするかも"}
        {"そこで、dmp の種別の選択 pull down を置く"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1.5rem", mt: "1.5rem" }}>
        <label>プロジェクト名</label>
        <TextField>
        </TextField>
        <Button variant="contained">
          保存する
        </Button>
        <Button variant="contained">
          DMP を出力する
        </Button>
      </Box>
    </OurCard>
  )
}
