import { Box, Container, Typography, Paper, Button } from "@mui/material"

import AppFooter from "@/components/AppFooter"
import AppHeaderBase from "@/components/AppHeaderBase"
import OurCard from "@/components/OurCard"

interface ErrorPageProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppHeaderBase />
        <Container maxWidth="lg" sx={{ justifyContent: "flex-start" }}>
          <OurCard sx={{ mt: "1.5rem" }}>
            <Typography
              sx={{ fontSize: "1.5rem" }}
              component="h1"
              children="エラーが発生しました。"
            />
            <Typography sx={{ mt: "0.5rem" }} >
              {"想定外のエラーが発生しました。お手数ですが、以下の詳細情報を開発者にお伝え下さい。"}
              <br />
              {"再試行ボタンをクリックすると、アプリケーションの状態が初期化され、再度読み込みが行われます。"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem", mt: "1.5rem" }} >
              <Box>
                <Typography sx={{ fontWeight: "bold" }}>
                  エラーメッセージ
                </Typography>
                <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
                  <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                    <pre>{error.message}</pre>
                  </Box>
                </Paper>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold" }}>
                  スタックトレース
                </Typography>
                <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
                  <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                    <pre>{error.stack}</pre>
                  </Box>
                </Paper>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={resetErrorBoundary}
                  children={"再試行する"}
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
