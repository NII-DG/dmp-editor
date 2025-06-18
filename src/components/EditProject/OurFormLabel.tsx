import { Typography } from "@mui/material"
import { SxProps } from "@mui/system"

export interface OurFormLabelProps {
  sx?: SxProps
  label: string
  required?: boolean
  htmlFor?: string
}

export default function OurFormLabel({ sx, label, required = false, htmlFor }: OurFormLabelProps) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        fontSize: "0.9rem",
        display: "inline-flex",
        alignItems: "center",
        mb: "0.25rem",
        gap: "0.25rem",
        ...sx,
      }}
    >
      {label}
      {required && <span style={{ color: "red" }}>*</span>}
    </Typography>
  )
}
