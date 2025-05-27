import { Box, Typography, Paper, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

import Frame from "@/components/Frame"
import OurCard from "@/components/OurCard"
import { getErrorChain } from "@/utils"

interface StatusPageProps {
  type: "error" | "notfound"
  error?: Error
  resetErrorBoundary?: () => void
}

export default function StatusPage({
  type,
  error,
  resetErrorBoundary,
}: StatusPageProps) {
  const navigate = useNavigate()
  const isErrorPage = type === "error"

  const title = isErrorPage
    ? "エラーが発生しました。"
    : "ページが見つかりません"
  const description = isErrorPage
    ? "想定外のエラーが発生しました。お手数ですが、以下の詳細情報を開発者にお伝え下さい。"
    : "お探しのページは存在しないか、移動された可能性があります。\nURL を確認するか、ホームページに戻ってください。"

  let errorMessage = ""
  let errorStack = ""
  if (isErrorPage && error) {
    const chain = getErrorChain(error)
    errorMessage = chain.map((err) => err.message).join("\n\nCaused by: ")
    errorStack = chain.map((err) => err.stack || err.message).join("\n\nCaused by: ")
  }

  const handleRetry = () => {
    if (isErrorPage && resetErrorBoundary) {
      resetErrorBoundary()
    } else {
      navigate("/")
    }
  }

  const handleClearAndRetry = () => {
    if (isErrorPage && resetErrorBoundary) {
      localStorage.clear()
      resetErrorBoundary()
    }
  }

  return (
    <Frame noAuth>
      <OurCard sx={{ mt: "1.5rem" }}>
        <Typography sx={{ fontSize: "1.5rem" }} component="h1">
          {title}
        </Typography>
        <Typography sx={{ mt: "0.5rem", whiteSpace: "pre-line" }}>
          {description}
        </Typography>
        {isErrorPage && (
          <>
            <Box sx={{ mt: "1.5rem" }}>
              <Typography sx={{ fontWeight: "bold" }}>エラーメッセージ</Typography>
              <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
                <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                  <pre>{errorMessage}</pre>
                </Box>
              </Paper>
            </Box>
            <Box sx={{ mt: "1rem" }}>
              <Typography sx={{ fontWeight: "bold" }}>スタックトレース</Typography>
              <Paper variant="outlined" sx={{ mt: "0.5rem", p: "0.5rem 1rem" }}>
                <Box sx={{ fontFamily: "monospace", overflowX: "auto" }}>
                  <pre>{errorStack}</pre>
                </Box>
              </Paper>
            </Box>
          </>
        )}
        <Box sx={{ display: "flex", gap: "1.5rem", mt: "1.5rem" }}>
          <Button variant="contained" color="secondary" onClick={handleRetry}>
            {isErrorPage ? "再試行する" : "ホームへ戻る"}
          </Button>
          {isErrorPage && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearAndRetry}
              sx={{ textTransform: "none" }}
            >
              Cache をクリアして再試行する
            </Button>
          )}
        </Box>
      </OurCard>
    </Frame>
  )
}
