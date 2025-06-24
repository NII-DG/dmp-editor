import { Typography, Divider } from "@mui/material"
import { SxProps } from "@mui/system"

import FileTreeSection from "@/components/EditProject/FileTreeSection"
import ProjectTableSection from "@/components/EditProject/ProjectTableSection"
import OurCard from "@/components/OurCard"
import { ProjectInfo } from "@/grdmClient"
import { User } from "@/hooks/useUser"

export interface GrdmCardProps {
  sx?: SxProps
  user: User
  projects: ProjectInfo[]
}

export default function GrdmCard({ sx, user, projects }: GrdmCardProps) {
  return (
    <OurCard sx={sx}>
      <Typography sx={{ fontSize: "1.5rem" }} component="h1">
        {"GRDM との連携"}
      </Typography>
      <ProjectTableSection sx={{ mt: "1rem" }} user={user} projects={projects} />
      <Divider sx={{ my: "1.5rem" }} />
      <FileTreeSection sx={{ mt: "1rem" }} projects={projects} />
    </OurCard>
  )
}
