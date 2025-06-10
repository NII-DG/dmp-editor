import { Box, TextField, FormControl, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import React from "react"
import { useFormContext, Controller } from "react-hook-form"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { revisionType } from "@/dmp"
import type { DmpMetadata } from "@/dmp"

const formData: {
  key: keyof DmpMetadata
  label: string
  required: boolean
  width: string
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
}[] = [
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

export default function DmpMetadataSection({ sx }: { sx?: SxProps }) {
  const { control } = useFormContext<{ metadata: DmpMetadata }>()
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP 作成・更新情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        {formData.map(({ key, label, required, width, helperText, type, options }) => (
          <Controller
            key={key}
            name={`metadata.${key}`}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                  <OurFormLabel label={label} required={required} />
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
