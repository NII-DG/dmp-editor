import { Box, Typography, Button } from "@mui/material"
import { SxProps } from "@mui/system"
import { useNavigate } from "react-router"

import OurCard from "@/components/OurCard"

export interface NoAuthCardProps {
  sx?: SxProps
}

export default function NoAuthCardProps({ sx }: NoAuthCardProps) {
  const navigate = useNavigate()

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children="認証が必要です"
      />
      <Typography sx={{ mt: "0.5rem" }}>
        {"このページを表示するには、認証が必要です。"}
        <br />
        {"ホームにて認証を行ってください。"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", mt: "1rem" }}>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/")}
            children="ホームへ戻る"
          />
        </Box>
      </Box>
    </OurCard>
  )
}
