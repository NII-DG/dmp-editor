import { Box, TextField, FormControl, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import React from "react"
import { useFormContext, Controller } from "react-hook-form"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import type { ProjectInfo } from "@/dmp"

const formData: {
  key: keyof ProjectInfo
  label: string
  required: boolean
  width: string
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
  helpChip?: React.ReactNode
}[] = [
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
    helpChip: (
      <>
        NISTEP 体系的番号一覧 (
        <a
          href="https://www.nistep.go.jp/taikei"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.nistep.go.jp/taikei
        </a>
        ) の「事業・制度名」を記載してください。
      </>
    ),
  },
  {
    key: "programCode",
    label: "体系的番号におけるプログラム情報コード",
    required: false,
    width: "480px",
    type: "text",
    helpChip: (
      <>
        NISTEP 体系的番号一覧 (
        <a
          href="https://www.nistep.go.jp/taikei"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.nistep.go.jp/taikei
        </a>
        ) の「機関コード」および「事業特定コード」を記載してください。
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

export interface ProjectInfoSectionProps {
  sx?: SxProps
}

export default function ProjectInfoSection({ sx }: ProjectInfoSectionProps) {
  const { control } = useFormContext<{ projectInfo: ProjectInfo }>()
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="プロジェクト情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        {formData.map(({ key, label, required, width, helperText, type, options, helpChip }) => (
          <Controller
            key={key}
            name={`projectInfo.${key}`}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth>
                <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <OurFormLabel label={label} required={required} />
                  {helpChip && <span>{helpChip}</span>}
                </Box>
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? helperText}
                  sx={{ maxWidth: width }}
                  type={type === "date" ? "date" : "text"}
                  select={type === "select"}
                  size="small"
                >
                  {type === "select" &&
                    options!.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                </TextField>
              </FormControl>
            )}
          />
        ))}
      </Box>
    </Box>
  )
}
