import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material"
import { Box, Button, Divider, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Link, OutlinedInput, Typography } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useSetRecoilState } from "recoil"

import tokenEg1Url from "@/assets/token-eg-1.png"
import tokenEg2Url from "@/assets/token-eg-2.png"
import OurCard from "@/components/OurCard"
import { authenticateGrdm } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

export interface LoginCardProps {
  sx?: SxProps
}

interface FormValues {
  token: string
}

export default function LoginCard({ sx }: LoginCardProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { token: "" },
  })
  const [showToken, setShowToken] = useState(false)
  const setToken = useSetRecoilState(tokenAtom)

  const onSubmit = async (data: FormValues) => {
    const { token } = data
    try {
      const result = await authenticateGrdm(token)
      if (result) {
        setToken(token)
      } else {
        setError("token", { type: "manual", message: "認証に失敗しました。Token を確認してください。" })
      }
    } catch (e) {
      console.error("Failed to authenticate with GRDM", e)
      setError("token", { type: "manual", message: "認証中にエラーが発生しました。" })
    }
  }

  return (
    <OurCard sx={sx}>
      <Typography sx={{ fontSize: "1.5rem" }} component="h1">
        {"GRDM との接続"}
      </Typography>
      <Typography sx={{ mt: "0.5rem" }}>
        {"GakuNin RDM の Token を取得し、入力してください。"}
        <br />
        {"この Token は、GakuNin RDM との疎通に用いられ、この Browser の Local Storage のみに保存されます。"}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "row", gap: "1.5rem", mt: "1.5rem" }}
      >
        <FormControl sx={{ flexGrow: 1, maxWidth: "400px" }} error={!!errors.token}>
          <InputLabel>
            {"GRDM Token"}
          </InputLabel>
          <Controller
            name="token"
            control={control}
            rules={{ required: "Token を入力してください。" }}
            render={({ field }) => (
              <OutlinedInput
                {...field}
                type={showToken ? "text" : "password"}
                label="GRDM Token"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowToken((prev) => !prev)} edge="end">
                      {showToken ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            )}
          />
          <FormHelperText>{errors.token?.message ?? ""}</FormHelperText>
        </FormControl>
        <Box sx={{ mt: "0.5rem" }}>
          <Button
            type="submit"
            variant="contained"
            sx={{ width: "120px" }}
            color="secondary"
            disabled={isSubmitting}
            startIcon={<LockOutlined />}
          >
            {isSubmitting ? "認証中..." : "認証"}
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mt: "1.5rem", mb: "1.5rem" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Typography>
          {"Token は、"}
          <Link href="https://rdm.nii.ac.jp/settings/tokens" target="_blank" rel="noopener noreferrer">
            {"https://rdm.nii.ac.jp/settings/tokens"}
          </Link>
          {" から取得できます。"}
          <br />
          {"また、"}
          <Link
            href="https://support.rdm.nii.ac.jp/usermanual/Setting-06/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {"パーソナルアクセストークン | GakuNin RDM サポートポータル"}
          </Link>
          {" も参照してください。"}
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
