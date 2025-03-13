import { DownloadingOutlined } from "@mui/icons-material"
import { Typography, Button } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import OurCard from "@/components/OurCard"
import { exportToExcel } from "@/dmp"
import { dmpAtom, formValidSelector, submitTriggerAtom } from "@/store/dmp"

export interface ExportDmpCardProps {
  sx?: SxProps
}

export default function ExportDmpCard({ sx }: ExportDmpCardProps) {
  const dmp = useRecoilValue(dmpAtom)
  const isFormValid = useRecoilValue(formValidSelector)
  const setSubmitTrigger = useSetRecoilState(submitTriggerAtom)
  const [downloadRequested, setDownloadRequested] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setSubmitTrigger((prev) => prev + 1)
    setTimeout(() => {
      setDownloadRequested(true)
    }, 500)
  }

  useEffect(() => {
    if (!downloadRequested) return
    if (!isFormValid) {
      setDownloadRequested(false)
      return
    }

    setDownloading(true)

    // Download DMP file
    const excelBlob = exportToExcel(dmp)
    const url = URL.createObjectURL(excelBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = "dmp.xlsx"
    a.click()
    URL.revokeObjectURL(url)

    setDownloading(false)
    setDownloadRequested(false)
  }, [downloadRequested]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children={"DMP の出力"}
      />
      <Button
        variant="contained"
        color="secondary"
        onClick={handleDownload}
        sx={{
          textTransform: "none",
          width: "180px",
          mt: "1.5rem",
        }}
        children="DMP を出力する"
        disabled={!isFormValid || downloading}
        startIcon={<DownloadingOutlined />}
      />
    </OurCard>
  )
}
