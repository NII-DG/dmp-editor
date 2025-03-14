import { Box, TextField, FormControl, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect } from "react"
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { revisionType, todayString, DmpMetadata } from "@/dmp"
import { formValidationState, dmpAtom, formTouchedStateAtom } from "@/store/dmp"

interface DmpMetadataSectionProps {
  sx?: SxProps
}

interface FormData {
  key: keyof DmpMetadata
  label: string
  required: boolean
  width: string
  helperText: string
  type: "text" | "date" | "select"
  options?: string[]
}

const formData: FormData[] = [
  {
    key: "revisionType",
    label: "種別",
    required: true,
    width: "480px",
    helperText: "",
    type: "select",
    options: [...revisionType],
  },
  {
    key: "submissionDate",
    label: "提出日",
    required: true,
    width: "480px",
    helperText: "",
    type: "date",
  },
  {
    key: "dateCreated",
    label: "DMP 作成年月日",
    required: true,
    width: "480px",
    helperText: "",
    type: "date",
  },
  {
    key: "dateModified",
    label: "DMP 最終更新年月日",
    required: true,
    width: "480px",
    helperText: "",
    type: "date",
  },
]

export default function DmpMetadataSection({ sx }: DmpMetadataSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const errors = useRecoilValue(formValidationState)
  const setTouched = useSetRecoilState(formTouchedStateAtom)

  const updateValue = <K extends keyof DmpMetadata>(key: K, value: DmpMetadata[K]) => {
    setDmp((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }))
  }
  const updateTouched = (key: keyof DmpMetadata) => {
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }))
  }

  // Set initial values
  useEffect(() => {
    updateValue("submissionDate", todayString())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP 作成・更新情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        {formData.map(({ key, label, required, width, helperText, type, options }) => (
          <FormControl key={key} fullWidth>
            <OurFormLabel label={label} required={required} />
            <TextField
              fullWidth
              variant="outlined"
              error={errors[key] !== null}
              helperText={errors[key] ?? helperText}
              sx={{
                maxWidth: width,
              }}
              value={dmp.metadata[key]}
              onChange={(e) => updateValue(key, e.target.value)}
              onBlur={() => updateTouched(key)}
              type={type === "date" ? "date" : "text"}
              select={type === "select"}
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
