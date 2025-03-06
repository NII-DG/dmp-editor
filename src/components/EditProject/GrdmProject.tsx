import { OpenInNew } from "@mui/icons-material"
import { Box, FormControl, TextField, Typography, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"

import { ProjectInfo, listingProjects, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { projectNameAtom, formValidationStateAtom } from "@/store/dmp"
import { tokenAtom } from "@/store/token"
import { theme } from "@/theme"

export interface GrdmProjectProps {
  sx?: SxProps
  isNew: boolean
  project?: ProjectInfo
}

export default function GrdmProject({ sx, isNew, project }: GrdmProjectProps) {
  const { showBoundary } = useErrorBoundary()
  const token = useRecoilValue(tokenAtom)
  const [projectName, setProjectName] = useRecoilState(projectNameAtom)
  const setFormValidationState = useSetRecoilState(formValidationStateAtom)
  const [existsProjectNames, setExistsProjectNames] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isNew) return

    listingProjects(token).then((projects) => {
      setExistsProjectNames(
        projects
          .filter(project => project.title.startsWith(DMP_PROJECT_PREFIX))
          .map(project => project.title),
      )
    }).catch((error) => {
      showBoundary(error)
    })
  }, [isNew, token, showBoundary])

  const changeProjectName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNew) return

    const newValue = e.target.value
    setProjectName(newValue)

    if (existsProjectNames.includes(`${DMP_PROJECT_PREFIX}${newValue}`)) {
      setError("同じ名前の GRDM プロジェクトが既に存在します。")
      setFormValidationState(prev => ({ ...prev, projectName: false }))
      return
    }
    if (newValue === "") {
      setError("プロジェクト名を入力してください。")
      setFormValidationState(prev => ({ ...prev, projectName: false }))
      return
    }

    setError(null)
    setFormValidationState(prev => ({ ...prev, projectName: true }))
  }

  return (
    <Box sx={{ ...sx }}>
      {isNew ? (<>
        <Typography>
          {"DMP の情報は、新しく作成する GRDM プロジェクトに保存されます。"}
          <br />
          {"作成する GRDM プロジェクトの名前を入力してください。"}
        </Typography>
        <FormControl fullWidth sx={{ mt: "1rem" }}>
          <Typography component="label" sx={{ fontSize: "0.9rem", mb: "0.25rem" }} children="GRDM プロジェクト名" />
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Typography
              sx={{ fontFamily: "monospace", color: theme.palette.grey[700], mb: "1.6rem" }}
              children={DMP_PROJECT_PREFIX}
            />
            <TextField
              variant="outlined"
              value={projectName}
              onChange={changeProjectName}
              error={!!error}
              helperText={error ?
                error :
                "\"dmp-project-\" という prefix が付与されます。"
              }
              sx={{ maxWidth: "480px" }}
              size="small"
              fullWidth
            />
          </Box>
        </FormControl>
      </>) : (<>
        <Typography>
          {"DMP Project は、以下の GRDM プロジェクト内に保存されています。"}
        </Typography>
        <Link
          href={project?.html ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            mt: "0.5rem",
            fontSize: "1.1rem",
          }}
        >
          {project?.title ?? ""}
          <OpenInNew sx={{ fontSize: "1rem" }} />
        </Link>
      </>)}
    </Box>
  )
}
