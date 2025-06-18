import { EditOutlined, OpenInNew } from "@mui/icons-material"
import {
  Box,
  Button,
  Link,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  colors,
} from "@mui/material"
import { SxProps } from "@mui/system"
import { useNavigate } from "react-router"

import OurCard from "@/components/OurCard"
import { ProjectInfo, formatDateToTimezone, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { User } from "@/hooks/useUser"

interface ProjectTableProps {
  sx?: SxProps
  user: User
  projects: ProjectInfo[]
}

/**
 * Renders table header for ProjectTable
 */
function ProjectTableHeader() {
  return (
    <TableHead sx={{ backgroundColor: colors.grey[100] }}>
      <TableRow>
        <TableCell sx={{ fontWeight: "bold", textAlign: "left", p: "1rem 1rem", width: "50%" }}>
          {"プロジェクト名"}
        </TableCell>
        <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>
          {"作成日"}
        </TableCell>
        <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>
          {"最終更新日"}
        </TableCell>
        <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "10%" }} />
      </TableRow>
    </TableHead>
  )
}

/**
 * Renders a single project row
 */
function ProjectTableRow({ project, user }: { project: ProjectInfo; user: User }) {
  const navigate = useNavigate()
  return (
    <TableRow key={project.id}>
      <TableCell sx={{ textAlign: "left", p: "0.5rem 1rem", width: "50%" }}>
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
      <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "10%" }}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => navigate(`/projects/${project.id}`)}
          startIcon={<EditOutlined />}
        >
          {"編集"}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function ProjectTable({ sx, user, projects }: ProjectTableProps) {
  const navigate = useNavigate()
  const filtered = projects.filter((p) => p.title.startsWith(DMP_PROJECT_PREFIX))

  return (
    <OurCard sx={sx}>
      <Typography sx={{ fontSize: "1.5rem" }} component="h1">
        DMP Project 一覧
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1.5rem", mt: "0.5rem" }}>
        {filtered.length !== 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography>あなたの GRDM アカウントに紐づく DMP Project 一覧です。</Typography>
            <Box sx={{ mt: "1rem" }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/projects/new")}
                sx={{ textTransform: "none" }}
              >
                新規 DMP Project を作成する
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: "none", mt: "1.5rem" }}>
              <Table>
                <ProjectTableHeader />
                <TableBody>
                  {filtered.map((project) => (
                    <ProjectTableRow key={project.id} project={project} user={user} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography>Project がありません。</Typography>
            <Box sx={{ mt: "1rem" }}>
              <Button variant="contained" color="secondary" onClick={() => navigate("/projects/new")} sx={{ textTransform: "none" }}>
                新規 DMP Project を作成する
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </OurCard>
  )
}
