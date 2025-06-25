import { AddLinkOutlined, LinkOffOutlined, OpenInNew } from "@mui/icons-material"
import { Box, Button, Link, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useFieldArray, useFormContext } from "react-hook-form"

import SectionHeader from "@/components/EditProject/SectionHeader"
import { DmpFormValues } from "@/dmp"
import { DMP_PROJECT_PREFIX, ProjectInfo, formatDateToTimezone } from "@/grdmClient"
import { User } from "@/hooks/useUser"

interface ProjectTableProps {
  sx?: SxProps
  user: User
  projects: ProjectInfo[]
}

export default function ProjectTableSection({ sx, user, projects }: ProjectTableProps) {
  const { control } = useFormContext<DmpFormValues>()
  const { fields, insert, remove } = useFieldArray<DmpFormValues, "dmp.linkedGrdmProjects">({
    control,
    name: "dmp.linkedGrdmProjects",
  })

  const linkedProjectIds = fields.map((p) => p.projectId)
  const filtered = projects.filter((p) => !p.title.startsWith(DMP_PROJECT_PREFIX))

  const handleLinkProject = (projectId: string) => {
    const existingProject = fields.find((p) => p.projectId === projectId)
    if (existingProject) return

    const indexInProjects = filtered.findIndex((p) => p.id === projectId)
    let insertIndex = fields.length
    for (let i = 0; i < fields.length; i++) {
      const currentProjectIndex = filtered.findIndex((p) => p.id === fields[i].projectId)
      if (currentProjectIndex > indexInProjects) {
        insertIndex = i
        break
      }
    }
    insert(insertIndex, { projectId })
  }

  const handleUnlinkProject = (projectId: string) => {
    const index = fields.findIndex((p) => p.projectId === projectId)
    if (index !== -1) {
      remove(index)
    }
  }

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP と GRDM との関連付け" />
      <Typography sx={{ mt: "0.5rem" }}>
        {"DMP Project と GRDM Project との関連付けを行います。"}
        <br />
        {"あなたの GRDM アカウント上の GRDM Project 一覧です。"}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: "none", mt: "1.5rem" }}>
        <Table>
          <TableHead sx={{ backgroundColor: colors.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", textAlign: "left", p: "0.5rem 1rem", width: "40%" }}>{"プロジェクト名"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>{"作成日"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>{"最終更新日"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem", width: "20%" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((project) => (
              <TableRow key={project.id}>
                <TableCell sx={{ textAlign: "left", p: "0.5rem 1rem", width: "40%" }}>
                  <Link
                    href={project.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
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
                    color={linkedProjectIds.includes(project.id) ?
                      "warning" :
                      "primary"
                    }
                    size="small"
                    onClick={linkedProjectIds.includes(project.id) ?
                      () => handleUnlinkProject(project.id) :
                      () => handleLinkProject(project.id)
                    }
                    startIcon={linkedProjectIds.includes(project.id) ?
                      <LinkOffOutlined /> :
                      <AddLinkOutlined />
                    }
                    sx={{ width: "130px" }}
                  >
                    {
                      linkedProjectIds.includes(project.id) ?
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
    </Box>
  )
}
