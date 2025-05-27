import { AddLinkOutlined, OpenInNew, LinkOffOutlined } from "@mui/icons-material"
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, Paper, Button, TableBody, colors, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect } from "react"
import { useRecoilValue, useRecoilState } from "recoil"

import OurCard from "@/components/OurCard"
import { ProjectInfo, formatDateToTimezone } from "@/grdmClient"
import { existingGrdmProjectsAtom, dmpAtom } from "@/store/dmp"
import { User } from "@/store/user"
import theme from "@/theme"

export interface GrdmCardProps {
  sx?: SxProps
  user: User
}

export default function GrdmCard({ sx, user }: GrdmCardProps) {
  const existingGrdmProjects = useRecoilValue(existingGrdmProjectsAtom)
  const filteredGrdmProjects = existingGrdmProjects.filter(
    (project) => !project.title.startsWith("dmp-project-"),
  )
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const linkedGrdmProjects = filteredGrdmProjects.filter((project) =>
    dmp.linkedGrdmProjectIds?.includes(project.id),
  )
  const linkedGrdmProjectIds = linkedGrdmProjects.map((project) => project.id)

  const linkGrdmProject = (project: ProjectInfo) => {
    setDmp((prev) => ({
      ...prev,
      linkedGrdmProjectIds: Array.from(new Set([...prev.linkedGrdmProjectIds ?? [], project.id])),
    }))
  }

  const unLinkGrdmProject = (project: ProjectInfo) => {
    setDmp((prev) => ({
      ...prev,
      linkedGrdmProjectIds: prev.linkedGrdmProjectIds?.filter((id) => id !== project.id),
    }))
  }

  useEffect(() => {
    if (linkedGrdmProjectIds.length === 0) return
  }, [linkedGrdmProjectIds])

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children={"DMP への GRDM Project の関連付け"}
      />
      <TableContainer component={Paper} variant="outlined" sx={{
        borderBottom: "none",
        mt: "1rem",
        width: "100%",
        overflowX: "auto",
      }}>
        <Table sx={{ minWidth: theme.breakpoints.values.md }}>
          <TableHead sx={{ backgroundColor: colors.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", textAlign: "left", p: "1rem 1rem", width: "40%" }}>{"プロジェクト名"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>{"作成日"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>{"最終更新日"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "30%" }}>{""}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGrdmProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell sx={{ textAlign: "left", p: "0.5rem 1rem", width: "40%" }}>
                  <Link
                    href={project.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      textDecoration: "none",
                    }}
                  >
                    {project.title}
                    <OpenInNew sx={{ fontSize: "1rem" }} />
                  </Link>
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>
                  {formatDateToTimezone(project.dateCreated, user.timezone)}
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>
                  {formatDateToTimezone(project.dateModified, user.timezone)}
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>
                  <Button
                    variant="outlined"
                    color={
                      linkedGrdmProjectIds.includes(project.id) ?
                        "warning" :
                        "primary"
                    }
                    size="small"
                    onClick={
                      linkedGrdmProjectIds.includes(project.id) ?
                        () => unLinkGrdmProject(project) :
                        () => linkGrdmProject(project)
                    }
                    startIcon={
                      linkedGrdmProjectIds.includes(project.id) ?
                        <LinkOffOutlined /> :
                        <AddLinkOutlined />
                    }
                    sx={{
                      width: "130px",
                    }}
                  >
                    {
                      linkedGrdmProjectIds.includes(project.id) ?
                        "関連付け解除" :
                        "関連付ける"
                    }
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box>
        {"filetree を表示する"}
      </Box>
    </OurCard>
  )
}
