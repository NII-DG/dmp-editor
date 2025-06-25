import { AddLinkOutlined, LinkOffOutlined, OpenInNew } from "@mui/icons-material"
import { Box, Button, Link, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, colors, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"

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

  const { update: updateDataInfo } = useFieldArray<DmpFormValues, "dmp.dataInfo">({
    control,
    name: "dmp.dataInfo",
  })
  const dataInfos = useWatch<DmpFormValues>({
    name: "dmp.dataInfo",
    defaultValue: [],
  }) as DmpFormValues["dmp"]["dataInfo"]
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingUnlinkProjectId, setPendingUnlinkProjectId] = useState<string | null>(null)

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

  const handleUnlinkProjectRequest = (projectId: string) => {
    const isLinkedToFiles = dataInfos.some((info) => info.linkingFiles.some((file) => file.projectId === projectId))

    if (isLinkedToFiles) {
      setPendingUnlinkProjectId(projectId)
      setConfirmDialogOpen(true)
    } else {
      handleUnlinkProject(projectId)
    }
  }

  const confirmUnlinkProject = () => {
    if (!pendingUnlinkProjectId) return

    dataInfos.forEach((info, index) => {
      const hasLinkedFileFromProject = info.linkingFiles.some((file) => file.projectId === pendingUnlinkProjectId)
      if (hasLinkedFileFromProject) {
        const updatedFiles = info.linkingFiles.filter((file) => file.projectId !== pendingUnlinkProjectId)
        updateDataInfo(index, { ...info, linkingFiles: updatedFiles })
      }
    })

    handleUnlinkProject(pendingUnlinkProjectId)
    setConfirmDialogOpen(false)
    setPendingUnlinkProjectId(null)
  }

  const cancelUnlinkProject = () => {
    setConfirmDialogOpen(false)
    setPendingUnlinkProjectId(null)
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
                      () => handleUnlinkProjectRequest(project.id) :
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

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        closeAfterTransition={false}
      >
        <DialogTitle sx={{ mt: "0.5rem", mx: "1rem" }}>
          {"DMP と GRDM との関連付けの解除"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "0.5rem", mx: "1rem" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Typography>
              {"この GRDM プロジェクト内のファイルが、DMP の研究データ情報にリンクされています。"}
              <br />
              {"関連付けを解除すると、これらのリンクは削除されます。"}
              <br />
              <span style={{ fontWeight: "bold" }}>
                {"本当に関連付けを解除しますか？"}
              </span>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={confirmUnlinkProject}
          >
            {"解除する"}
          </Button>
          <Button children="キャンセル" onClick={cancelUnlinkProject} variant="outlined" color="secondary" />
        </DialogActions>
      </Dialog>
    </Box>
  )
}
