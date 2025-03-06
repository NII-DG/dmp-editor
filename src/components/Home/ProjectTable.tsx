import { OpenInNew } from "@mui/icons-material"
import { Box, Button, CircularProgress, Link, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useNavigate } from "react-router"
import { useRecoilValue, useRecoilValueLoadable } from "recoil"

import OurCard from "@/components/OurCard"
import { Project, listingProjects, DMP_PROJECT_PREFIX, formatDateToTimezone } from "@/grdmClient"
import { tokenAtom, authenticatedSelector } from "@/store/token"
import { userSelector } from "@/store/user"

export interface ProjectTableProps {
  sx?: SxProps
}

export default function ProjectTable({ sx }: ProjectTableProps) {
  const navigate = useNavigate()
  const { showBoundary } = useErrorBoundary()
  const token = useRecoilValue(tokenAtom)
  const auth = useRecoilValueLoadable(authenticatedSelector)
  const user = useRecoilValueLoadable(userSelector)
  const isAuth = (auth.state === "hasValue" && auth.contents) &&
    (user.state === "hasValue" && user.contents) &&
    token !== ""

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuth) return

    setLoading(true)
    listingProjects(token).then((projects) => {
      setProjects(projects.filter(project => project.title.startsWith(DMP_PROJECT_PREFIX)))
    }).catch((error) => {
      showBoundary(error)
    }).finally(() => setLoading(false))
  }, [isAuth, token, showBoundary])

  return (
    <OurCard sx={{ ...sx }}>
      <Typography
        sx={{ fontSize: "1.5rem" }}
        component="h1"
        children="DMP Project 一覧"
      />
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1.5rem", mt: "0.5rem" }}>
        {loading ? (
          <CircularProgress size={24} sx={{ visibility: loading ? "visible" : "hidden" }} />
        ) : projects.length !== 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography>
              {"あなたの GRDM アカウントに紐づく DMP Project 一覧です。"}
            </Typography>
            <Box sx={{ mt: "1rem" }}>
              <Button variant="contained" color="primary" onClick={() => navigate("/project/new")} sx={{ textTransform: "none" }}>
                {"新規 DMP Project を作成する"}
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: "none", mt: "1.5rem" }}>
              <Table>
                <TableHead sx={{ backgroundColor: colors.grey[100] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "left", p: "1rem 1rem", width: "50%" }}>{"プロジェクト名"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>{"作成日"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "20%" }}>{"最終更新日"}</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: "1rem 1rem", width: "10%" }}>{""}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell sx={{ textAlign: "left", p: "0.5rem 1rem", width: "50%" }}>
                        <Link
                          href={project.html}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none",
                          }}
                        >
                          {project.title}
                          <OpenInNew sx={{ fontSize: "1rem" }} />
                        </Link>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>
                        {formatDateToTimezone(project.dateCreated, user.contents.timezone)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "20%" }}>
                        {formatDateToTimezone(project.dateModified, user.contents.timezone)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", p: "0.5rem 1rem", width: "10%" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/project/${project.id}`)}
                        >
                          {"編集"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography children="Project がありません。" />
            <Box sx={{ mt: "1rem" }}>
              <Button variant="contained" color="primary" onClick={() => navigate("/project/new")} sx={{ textTransform: "none" }}>
                {"新規 DMP Project を作成する"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </OurCard>
  )
}
