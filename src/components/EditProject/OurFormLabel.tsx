import { Typography } from "@mui/material"
import { SxProps } from "@mui/system"

export interface OurFormLabelProps {
  sx?: SxProps
  label: string
  required?: boolean
}

export default function OurFormLabel({ sx, label, required }: OurFormLabelProps) {
  return (
    <Typography component="label" sx={{ fontSize: "0.9rem", mb: "0.25rem", ...sx }}>
      {label}
      {required && <span style={{ color: "red" }}>*</span>}
    </Typography>
  )
}
