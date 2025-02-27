import { Visibility, VisibilityOff } from "@mui/icons-material"
import { Box, Button, Divider, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Link, OutlinedInput, Typography } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useSetRecoilState } from "recoil"

import tokenEg1Url from "@/assets/token-eg-1.png"
import tokenEg2Url from "@/assets/token-eg-2.png"
import OurCard from "@/components/OurCard"
import { authenticateGrdm } from "@/grdmClient"
import { tokenAtom, authenticatedSelector } from "@/store/token"

export interface LoginCardProps {
  sx?: SxProps
}

export default function LoginCard({ sx }: LoginCardProps) {
  const [showToken, setShowToken] = useState(false)
  const [inputToken, setInputToken] = useState("") // for form input
  const setToken = useSetRecoilState(tokenAtom)
  const setAuth = useSetRecoilState(authenticatedSelector)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const handleAuthenticate = async () => {
    setError(null)
    if (inputToken === "") {
      setError("Token を入力してください。")
      return
    }

    setIsAuthenticating(true)
    try {
      const result = await authenticateGrdm(inputToken)
      setIsAuthenticated(result)
      if (result) {
        setToken(inputToken)
        setAuth(true)
      } else {
        setError("認証に失敗しました。Token を確認してください。")
      }
    } catch (error) {
      setError("認証中にエラーが発生しました。")
      console.error("Failed to authenticate with GRDM", error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children="GRDM との接続"
      />
      <Typography sx={{ mt: "0.5rem" }} >
        {"GakuNin RDM の Token を取得し、入力してください。"}
        <br />
        {"この Token は、GakuNin RDM との疎通に用いられ、この Browser の Local Storage のみに保存されます。"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1.5rem", mt: "1.5rem" }} >
        <FormControl sx={{ flexGrow: 1, maxWidth: "400px" }}>
          <InputLabel children="GRDM Token" />
          <OutlinedInput
            type={showToken ? "text" : "password"}
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            label="GRDM Token"
            error={!!error}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowToken(!showToken)}
                  edge="end"
                  children={showToken ? <Visibility /> : <VisibilityOff />}
                />
              </InputAdornment>
            }
          />
          <FormHelperText sx={{ color: "error.main", minHeight: "1.5rem" }}>
            {error || ""}
          </FormHelperText>
        </FormControl>
        <Button
          variant="contained"
          sx={{ width: "120px", mb: "1.65rem" }}
          onClick={handleAuthenticate}
          disabled={isAuthenticating || !!isAuthenticated}
        >
          {isAuthenticated ? "認証済み" : isAuthenticating ? "認証中..." : "認証"}
        </Button>
      </Box>
      <Divider sx={{ mt: "0.5rem", mb: "2rem" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Typography>
          {"Token は、"}
          <Link
            href="https://rdm.nii.ac.jp/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            children="https://rdm.nii.ac.jp/settings/tokens"
          />
          {" から取得できます。"}
          {"下の画像を参考にしてください。"}
        </Typography>
        <Box
          component="img"
          src={tokenEg1Url}
          alt="Example of getting token from GakuNin RDM"
          sx={{
            width: "100%",
            maxWidth: "600px",
            display: "block",
            borderRadius: 2,
            boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
            margin: "auto",
          }}
        />
        <Box
          component="img"
          src={tokenEg2Url}
          alt="Example of getting token from GakuNin RDM"
          sx={{
            width: "100%",
            maxWidth: "600px",
            display: "block",
            borderRadius: 2,
            boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
            margin: "auto",
          }}
        />
      </Box>
    </OurCard>
  )
}
