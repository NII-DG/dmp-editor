import { Box } from "@mui/material"
import { SxProps } from "@mui/system"

import SectionHeader from "@/components/EditProject/SectionHeader"
import { User } from "@/store/user"

interface PersonInfoSectionProps {
  sx?: SxProps
  user: User
}

export default function PersonInfoSection({ sx, user }: PersonInfoSectionProps) {
  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="担当者情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* write form here */}
      </Box>
    </Box>
  )
}
