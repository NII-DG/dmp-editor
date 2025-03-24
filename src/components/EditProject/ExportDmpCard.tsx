import { DownloadingOutlined } from "@mui/icons-material"
import { Typography, Button } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilValue, useSetRecoilState } from "recoil"

import OurCard from "@/components/OurCard"
import { exportToExcel } from "@/dmp"
import { dmpAtom, formValidState, formTouchedStateAtom, initFormTouchedState } from "@/store/dmp"

export interface ExportDmpCardProps {
  sx?: SxProps
}
export default function ExportDmpCard({ sx }: ExportDmpCardProps) {
  const { showBoundary } = useErrorBoundary()
  const dmp = useRecoilValue(dmpAtom)
  const setTouched = useSetRecoilState(formTouchedStateAtom)
  const isFormValid = useRecoilValue(formValidState)
  const [submitTrigger, setSubmitTrigger] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setTouched(initFormTouchedState(true))
    setSubmitTrigger(true)
  }

  useEffect(() => {
    // Use useEffect to re-evaluate the form validation (isFormValid) when submitTrigger changes
    if (!submitTrigger) return

    // submitTrigger の変更に伴い、errors が更新される
    if (isFormValid) {
      setDownloading(true)
      // Download DMP file
      try {
        const excelBlob = exportToExcel(dmp)
        const url = URL.createObjectURL(excelBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "dmp.xlsx"
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        showBoundary(error)
      }
      setDownloading(false)
    }
    setSubmitTrigger(false)
  }, [submitTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

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
        children={downloading ? "出力中..." : "DMP を出力する"}
        disabled={!isFormValid || downloading}
        startIcon={<DownloadingOutlined />}
      />
    </OurCard>
  )
}
