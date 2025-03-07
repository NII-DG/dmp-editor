import { Box, Typography, Paper, Button } from "@mui/material"

import Frame from "@/components/Frame"
import OurCard from "@/components/OurCard"

interface ErrorPageProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  return (
    <Frame noAuth>
      <OurCard sx={{ mt: "1.5rem" }}>
        <Typography
          sx={{ fontSize: "1.5rem" }}
          component="h1"
          children="エラーが発生しました。"
        />
        <Typography sx={{ mt: "0.5rem" }}>
          {"想定外のエラーが発生しました。お手数ですが、以下の詳細情報を開発者にお伝え下さい。"}
          <br />
          {"再試行ボタンをクリックすると、アプリケーションの状態が初期化され、再度読み込みが行われます。"}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem", mt: "1.5rem" }}>
          <Box>
            <Typography sx={{ fontWeight: "bold" }}>
              {"エラーメッセージ"}
            </Typography>
            <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
              <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                <pre>{error.message}</pre>
              </Box>
            </Paper>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: "bold" }}>
              {"スタックトレース"}
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
              color="secondary"
              onClick={resetErrorBoundary}
              children={"再試行する"}
            />
          </Box>
        </Box>
      </OurCard>
    </Frame>
  )
}
