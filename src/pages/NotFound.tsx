import { Box, Container, Typography, Button } from "@mui/material"
import { useNavigate } from "react-router"

import AppFooter from "@/components/AppFooter"
import AppHeaderBase from "@/components/AppHeaderBase"
import OurCard from "@/components/OurCard"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppHeaderBase />
        <Container maxWidth="lg" sx={{ justifyContent: "flex-start" }}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem", mt: "1.5rem" }}>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/")}
                  children="ホームへ戻る"
                />
              </Box>
            </Box>
          </OurCard>
        </Container>
      </Box>
      <AppFooter />
    </Box>
  )
}
