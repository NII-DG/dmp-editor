import { Box, Typography, Paper, Button } from "@mui/material"

import Frame from "@/components/Frame"
import OurCard from "@/components/OurCard"
import { getErrorChain } from "@/utils"

interface ErrorPageProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  const errorChain = getErrorChain(error)
  const errorMessage = errorChain.reduce((acc, err, idx) => {
    if (idx === 0) return err.message
    return `${acc}\n\nCaused by: ${err.message}`
  }, "")
  const errorStack = errorChain.reduce((acc, err, idx) => {
    if (idx === 0) return err.stack || err.message
    return `${acc}\n\nCaused by: ${err.stack || err.message}`
  }, "")

  const resetWithCacheClear = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
      resetErrorBoundary()
    }
  }

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
                <pre>{errorMessage}</pre>
              </Box>
            </Paper>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: "bold" }}>
              {"スタックトレース"}
            </Typography>
            <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
              <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                <pre>{errorStack}</pre>
              </Box>
            </Paper>
          </Box>
          <Box sx={{ display: "flex", gap: "1.5rem" }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={resetErrorBoundary}
              children={"再試行する"}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={resetWithCacheClear}
              children={"Cache をクリアして再試行する"}
              sx={{ textTransform: "none" }}
            />
          </Box>
        </Box>
      </OurCard>
    </Frame>
  )
}
