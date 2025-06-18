import { DownloadingOutlined } from "@mui/icons-material"
import { Typography, Button, CircularProgress } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useFormContext } from "react-hook-form"

import OurCard from "@/components/OurCard"
import { exportToExcel } from "@/dmp"
import type { DmpFormValues } from "@/dmp"

export interface ExportDmpCardProps {
  sx?: SxProps
}

export default function ExportDmpCard({ sx }: ExportDmpCardProps) {
  const { showBoundary } = useErrorBoundary()
  const { getValues, trigger, formState } = useFormContext<DmpFormValues>()
  const { isValid, isSubmitted } = formState
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    const valid = await trigger()
    if (!valid) return
    setIsDownloading(true)
    try {
      const excelBlob = exportToExcel(getValues().dmp)
      const url = URL.createObjectURL(excelBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dmp.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      showBoundary(error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <OurCard sx={sx}>
      <Typography sx={{ fontSize: "1.5rem" }} component="h1">
        DMP の出力
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleDownload}
        sx={{
          textTransform: "none",
          width: "180px",
          mt: "1.5rem",
        }}
        disabled={isDownloading || (isSubmitted && !isValid)}
        startIcon={
          isDownloading ? <CircularProgress size={20} /> : <DownloadingOutlined />
        }
      >
        {isDownloading ? "出力中..." : "DMP を出力する"}
      </Button>
    </OurCard>
  )
}
