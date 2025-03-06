import { Box } from "@mui/material"
import { SxProps } from "@mui/system"

import SectionHeader from "@/components/EditProject/SectionHeader"

interface ProjectInfoSectionProps {
  sx?: SxProps
}

export default function ProjectInfoSection({ sx }: ProjectInfoSectionProps) {
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="プロジェクト情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* write form here */}
      </Box>
    </Box>
  )
}
