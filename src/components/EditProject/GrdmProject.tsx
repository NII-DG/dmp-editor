import { OpenInNew } from "@mui/icons-material"
import { Box, FormControl, TextField, Typography, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import { ProjectInfo, listingProjects, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { grdmProjectNameAtom, formTouchedStateAtom, formValidationState, existingGrdmProjectNamesAtom, existingGrdmProjectsAtom } from "@/store/dmp"
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
  const [grdmProjectName, setGrdmProjectName] = useRecoilState(grdmProjectNameAtom)
  const errors = useRecoilValue(formValidationState)
  const error = errors.grdmProjectName
  const setTouched = useSetRecoilState(formTouchedStateAtom)
  const setExistingGrdmProjectNames = useSetRecoilState(existingGrdmProjectNamesAtom)
  const setExistingGrdmProjects = useSetRecoilState(existingGrdmProjectsAtom)

  const updateTouch = () => {
    setTouched(prev => ({
      ...prev,
      grdmProjectName: true,
    }))
  }

  // Initialize existsProjectNames
  useEffect(() => {
    listingProjects(token).then((projects) => {
      if (isNew) {
        setExistingGrdmProjectNames(
          projects
            .filter(project => project.title.startsWith(DMP_PROJECT_PREFIX))
            .map(project => project.title),
        )
      }
      setExistingGrdmProjects([...projects])
    }).catch(showBoundary)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeProjectName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNew) return

    const newValue = e.target.value
    setGrdmProjectName(newValue)
    updateTouch()
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
          <OurFormLabel label="GRDM プロジェクト名" required />
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Typography
              sx={{ fontFamily: "monospace", color: theme.palette.grey[700], mb: "1.6rem" }}
              children={DMP_PROJECT_PREFIX}
            />
            <TextField
              variant="outlined"
              value={grdmProjectName}
              onChange={changeProjectName}
              onBlur={updateTouch}
              error={!!error}
              helperText={error ?
                error :
                "\"dmp-project-\" という prefix が付与されます。"
              }
              sx={{ maxWidth: "380px" }}
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
