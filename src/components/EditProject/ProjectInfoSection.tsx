import { Box, TextField, FormControl, Link, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import React, { useEffect } from "react"
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { ProjectInfo } from "@/dmp"
import { dmpAtom, formValidationState, formTouchedStateAtom } from "@/store/dmp"

interface ProjectInfoSectionProps {
  sx?: SxProps
}

interface FormData {
  key: keyof ProjectInfo
  label: string
  required: boolean
  width: string
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
  helpChip?: React.ReactNode
}

const formData: FormData[] = [
  {
    key: "fundingAgency",
    label: "資金配分機関情報",
    required: true,
    width: "480px",
    type: "text",
  },
  {
    key: "programName",
    label: "プログラム名 (事業名・種目名)",
    required: false,
    width: "480px",
    type: "text",
    helpChip: (<>
      {"NISTEP 体系的番号一覧 ("}
      <Link href="https://www.nistep.go.jp/taikei" target="_blank" rel="noopener" children="https://www.nistep.go.jp/taikei" />
      {") に掲載されている「事業・制度名」を記載してください。"}
    </>),
  },
  {
    key: "programCode",
    label: "体系的番号におけるプログラム情報コード",
    required: false,
    width: "480px",
    type: "text",
    helpChip: (
      <>
        {"NISTEP 体系的番号一覧 ("}
        <Link href="https://www.nistep.go.jp/taikei" target="_blank" rel="noopener" children="https://www.nistep.go.jp/taikei" />
        {") に掲載されている「機関コード」および「施策・事業の特定コード」を表すコードを記載してください。"}
      </>
    ),
  },
  {
    key: "projectCode",
    label: "体系的番号",
    required: true,
    width: "480px",
    type: "text",
  },
  {
    key: "projectName",
    label: "プロジェクト名",
    required: true,
    width: "480px",
    type: "text",
  },
  {
    key: "adoptionYear",
    label: "採択年度",
    required: false,
    width: "480px",
    type: "text",
  },
  {
    key: "startYear",
    label: "事業開始年度",
    required: false,
    width: "480px",
    type: "text",
  },
  {
    key: "endYear",
    label: "事業終了年度",
    required: false,
    width: "480px",
    type: "text",
  },
]

export default function ProjectInfoSection({ sx }: ProjectInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const errors = useRecoilValue(formValidationState)
  const setTouched = useSetRecoilState(formTouchedStateAtom)

  const updateValue = <K extends keyof ProjectInfo>(key: K, value: ProjectInfo[K]) => {
    setDmp((prev) => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [key]: value,
      },
    }))
  }
  const updateTouched = (key: keyof ProjectInfo) => {
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }))
  }

  // Set initial values
  useEffect(() => {
    // do nothing
  }, [])

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="プロジェクト情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        {formData.map(({ key, label, required, width, helperText, type, options, helpChip }) => (
          <FormControl key={key} fullWidth>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <OurFormLabel label={label} required={required} />
              {helpChip && <HelpChip text={helpChip} />}
            </Box>
            <TextField
              fullWidth
              variant="outlined"
              error={errors[key] !== null}
              helperText={errors[key] ?? helperText}
              sx={{
                maxWidth: width,
              }}
              value={dmp.projectInfo[key]}
              onChange={(e) => updateValue(key, e.target.value)}
              onBlur={() => updateTouched(key)}
              type={type === "date" ? "date" : "text"}
              select={type === "select"}
              size="small"
            >
              {type === "select" &&
                options!.map((option) => (
                  <MenuItem key={option} value={option} children={option} />
                ))}
            </TextField>
          </FormControl>
        ))}
      </Box>
    </Box>
  )
}
