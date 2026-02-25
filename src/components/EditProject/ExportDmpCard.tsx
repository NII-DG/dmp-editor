import DownloadingOutlined from "@mui/icons-material/DownloadingOutlined"
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined"
import { Typography, Button, CircularProgress, Menu, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useFormContext } from "react-hook-form"

import OurCard from "@/components/OurCard"
import { exportToExcel } from "@/dmp"
import type { DmpFormValues } from "@/dmp"
import { exportToJspsExcel } from "@/jspsExport"

export interface ExportDmpCardProps {
  sx?: SxProps
}

export default function ExportDmpCard({ sx }: ExportDmpCardProps) {
  const { showBoundary } = useErrorBoundary()
  const { getValues, trigger, formState } = useFormContext<DmpFormValues>()
  const { isValid, isSubmitted } = formState
  const [isDownloading, setIsDownloading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleDownload = async (format: "sample" | "jsps") => {
    const valid = await trigger()
    handleCloseMenu()
    if (!valid) return
    setIsDownloading(true)
    try {
      const dmp = getValues().dmp
      const blob = format === "jsps" ? exportToJspsExcel(dmp) : exportToExcel(dmp)
      const filename = format === "jsps" ? "jsps_dmp.xlsx" : "dmp.xlsx"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
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
        onClick={handleOpenMenu}
        sx={{
          textTransform: "none",
          width: "180px",
          mt: "1.5rem",
        }}
        disabled={isDownloading || (isSubmitted && !isValid)}
        startIcon={
          isDownloading ? <CircularProgress size={20} /> : <DownloadingOutlined />
        }
        endIcon={<KeyboardArrowDownOutlined />}
      >
        {isDownloading ? "出力中..." : "DMP を出力する"}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleDownload("sample")}>サンプル形式</MenuItem>
        <MenuItem onClick={() => handleDownload("jsps")}>JSPS 形式</MenuItem>
      </Menu>
    </OurCard>
  )
}
