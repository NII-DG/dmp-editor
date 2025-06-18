import { Box, TextField, FormControl, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import { useFormContext, Controller } from "react-hook-form"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { DmpFormValues, revisionType } from "@/dmp"
import type { DmpMetadata } from "@/dmp"

interface FormData {
  key: keyof DmpMetadata
  label: string
  required: boolean
  width: string
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
}

const formProps: FormData[] = [
  {
    key: "revisionType",
    label: "種別",
    required: true,
    width: "480px",
    type: "select",
    options: [...revisionType],
  },
  {
    key: "submissionDate",
    label: "提出日",
    required: true,
    width: "480px",
    type: "date",
  },
  {
    key: "dateCreated",
    label: "DMP 作成年月日",
    required: true,
    width: "480px",
    type: "date",
  },
  {
    key: "dateModified",
    label: "DMP 最終更新年月日",
    required: true,
    width: "480px",
    type: "date",
  },
]

interface DmpMetadataSectionProps {
  sx?: SxProps
}

export default function DmpMetadataSection({ sx }: DmpMetadataSectionProps) {
  const { control } = useFormContext<DmpFormValues>()

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP 作成・更新情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        {formProps.map(({ key, label, required, width, helperText, type, options }) => (
          <Controller
            key={key}
            name={`dmp.metadata.${key}`}
            control={control}
            rules={required ? { required: `${label} は必須です` } : {}}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth>
                <OurFormLabel label={label} required={required} htmlFor={`metadata.${key}`} />
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  error={!!error}
                  helperText={error?.message ?? helperText}
                  sx={{ maxWidth: width }}
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
            )}
          />
        ))}
      </Box>
    </Box>
  )
}
