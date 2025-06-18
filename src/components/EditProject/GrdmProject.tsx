import { OpenInNew } from "@mui/icons-material"
import { Box, FormControl, OutlinedInput, FormHelperText, Typography, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useFormContext, Controller } from "react-hook-form"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import { DmpFormValues } from "@/dmp"
import { DMP_PROJECT_PREFIX, ProjectInfo } from "@/grdmClient"
import { theme } from "@/theme"

export interface GrdmProjectProps {
  sx?: SxProps
  isNew: boolean
  project?: ProjectInfo | null
  projects: ProjectInfo[]
}

function NewGrdmProject({ projects }: { projects: ProjectInfo[] }) {
  const { control } = useFormContext<DmpFormValues>()
  const existingNames = projects.map((p) => p.title).filter((title) => title.startsWith(DMP_PROJECT_PREFIX))

  return (
    <>
      <Typography>
        {"DMP の情報は、新しく作成する GRDM プロジェクトに保存されます。"}
        <br />
        {"作成する GRDM プロジェクトの名前を入力してください。"}
      </Typography>
      <FormControl fullWidth sx={{ mt: "1rem" }}>
        <OurFormLabel label="GRDM プロジェクト名" required />
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <Typography
            sx={{
              fontFamily: "monospace",
              color: theme.palette.grey[700],
              whiteSpace: "nowrap",
              mb: "1.6rem",
            }}
            children={DMP_PROJECT_PREFIX}
          />
          <Controller
            name="grdmProjectName"
            control={control}
            rules={{
              required: "プロジェクト名は必須です",
              validate: (value: string) => {
                const full = `${DMP_PROJECT_PREFIX}${value}`
                return existingNames.includes(full) ? "同じ名前のプロジェクトが存在します" : true
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <OutlinedInput
                  {...field}
                  size="small"
                  error={!!error}
                  fullWidth
                  onBlur={field.onBlur}
                  sx={{ maxWidth: "380px" }}
                />
                <FormHelperText error={!!error}>
                  {error?.message ?? "\"dmp-project-\" という prefix が付与されます。"}
                </FormHelperText>
              </Box>
            )}
          />
        </Box>
      </FormControl>
    </>
  )
}

function ExistingGrdmProject({ project }: { project?: ProjectInfo | null }) {
  return (
    <>
      <Typography>
        {"DMP Project は、以下の GRDM プロジェクト内に保存されています。"}
      </Typography>
      {project?.html && (
        <Link
          href={project.html}
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
          {project.title}
          <OpenInNew sx={{ fontSize: "1rem" }} />
        </Link>
      )}
    </>
  )
}

export default function GrdmProject({ sx, isNew, project, projects }: GrdmProjectProps) {
  return (
    <Box sx={sx}>
      {isNew ? <NewGrdmProject projects={projects} /> : <ExistingGrdmProject project={project} />}
    </Box>
  )
}
