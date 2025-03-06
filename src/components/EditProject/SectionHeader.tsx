import { Typography } from "@mui/material"
import { SxProps } from "@mui/system"

export interface SectionHeaderProps {
  sx?: SxProps
  text: string
}

export default function SectionHeader({ sx, text }: SectionHeaderProps) {
  return (
    <Typography
      sx={{ fontSize: "1.2rem", ...sx }}
      component="h2"
      children={text}
    />
  )
}
