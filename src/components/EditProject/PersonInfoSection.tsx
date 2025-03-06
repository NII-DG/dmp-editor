import { Box } from "@mui/material"
import { SxProps } from "@mui/system"

import SectionHeader from "@/components/EditProject/SectionHeader"

interface PersonInfoSectionProps {
  sx?: SxProps
}

export default function PersonInfoSection({ sx }: PersonInfoSectionProps) {
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="担当者情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* write form here */}
      </Box>
    </Box>
  )
}
