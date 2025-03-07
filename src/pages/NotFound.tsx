import { Box, Typography, Button } from "@mui/material"
import { useNavigate } from "react-router"

import Frame from "@/components/Frame"
import OurCard from "@/components/OurCard"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <Frame noAuth>
      <OurCard sx={{ mt: "1.5rem" }}>
        <Typography
          sx={{ fontSize: "1.5rem" }}
          component="h1"
          children="ページが見つかりません"
        />
        <Typography sx={{ mt: "0.5rem" }}>
          {"お探しのページは存在しないか、移動された可能性があります。"}
          <br />
          {"URL を確認するか、ホームページに戻ってください。"}
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
    </Frame>
  )
}
