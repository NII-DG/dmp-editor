import { DownloadingOutlined } from "@mui/icons-material"
import { Typography, Button, CircularProgress } from "@mui/material"
import { SxProps } from "@mui/system"
import React, { useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useFormContext } from "react-hook-form"

import OurCard from "@/components/OurCard"
import { exportToExcel } from "@/dmp"
import type { Dmp } from "@/dmp"

export interface ExportDmpCardProps {
  sx?: SxProps
}

export default function ExportDmpCard({ sx }: ExportDmpCardProps) {
  const { showBoundary } = useErrorBoundary()
  const { getValues, trigger } = useFormContext<Dmp>()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const valid = await trigger()
    if (!valid) return
    setDownloading(true)
    try {
      const excelBlob = exportToExcel(getValues())
      const url = URL.createObjectURL(excelBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dmp.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      showBoundary(error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <OurCard sx={{ ...sx }}>
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
        disabled={downloading}
        startIcon={
          downloading ? <CircularProgress size={20} /> : <DownloadingOutlined />
        }
      >
        {downloading ? "出力中..." : "DMP を出力する"}
      </Button>
    </OurCard>
  )
}
