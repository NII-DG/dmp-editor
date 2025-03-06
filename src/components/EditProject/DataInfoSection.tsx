import { Box } from "@mui/material"
import { SxProps } from "@mui/system"

import SectionHeader from "@/components/EditProject/SectionHeader"

interface DataInfoSectionProps {
  sx?: SxProps
}

export default function DataInfoSection({ sx }: DataInfoSectionProps) {
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="研究データ情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* write form here */}
      </Box>
    </Box>
  )
}
