import { AddLinkOutlined, OpenInNew, LinkOffOutlined } from "@mui/icons-material"
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Button,
  TableBody,
  colors,
  Link as MuiLink,
} from "@mui/material"
import React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useRecoilValue } from "recoil"

import OurCard from "@/components/OurCard"
import type { Dmp } from "@/dmp"
import { ProjectInfo, formatDateToTimezone } from "@/grdmClient"
import { existingGrdmProjectsAtom } from "@/store/dmp"
import { User } from "@/store/user"
import theme from "@/theme"

export interface GrdmCardProps {
  sx?: object
  user: User
}

export default function GrdmCard({ sx, user }: GrdmCardProps) {
  const existingProjects = useRecoilValue(existingGrdmProjectsAtom)
  const { control, setValue } = useFormContext<{ linkedGrdmProjectIds?: string[] }>()
  const linkedIds = useWatch({ control, name: "linkedGrdmProjectIds" }) || []

  const available = existingProjects.filter((p) => !p.title.startsWith("dmp-project-"))
  const isLinked = (id: string) => linkedIds.includes(id)

  const toggleLink = (project: ProjectInfo) => {
    const next = isLinked(project.id)
      ? linkedIds.filter((id) => id !== project.id)
      : [...linkedIds, project.id]
    setValue("linkedGrdmProjectIds", next, { shouldValidate: true })
  }

  return (
    <OurCard sx={{ ...sx }}>
      <Typography sx={{ fontSize: "1.5rem" }} component="h1">
        DMP への GRDM Project の関連付け
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderBottom: "none", mt: "1rem", width: "100%", overflowX: "auto" }}
      >
        <Table sx={{ minWidth: theme.breakpoints.values.md }}>
          <TableHead sx={{ backgroundColor: colors.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", textAlign: "left", p: 2, width: "40%" }}>
                プロジェクト名
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: 2, width: "20%" }}>
                作成日
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: 2, width: "20%" }}>
                最終更新日
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center", p: 2, width: "20%" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {available.map((proj) => (
              <TableRow key={proj.id}>
                <TableCell sx={{ p: 1, width: "40%" }}>
                  <MuiLink
                    href={proj.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                  >
                    {proj.title}
                    <OpenInNew sx={{ fontSize: "1rem" }} />
                  </MuiLink>
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: 1, width: "20%" }}>
                  {formatDateToTimezone(proj.dateCreated, user.timezone)}
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: 1, width: "20%" }}>
                  {formatDateToTimezone(proj.dateModified, user.timezone)}
                </TableCell>
                <TableCell sx={{ textAlign: "center", p: 1, width: "20%" }}>
                  <Button
                    variant="outlined"
                    color={isLinked(proj.id) ? "warning" : "primary"}
                    size="small"
                    onClick={() => toggleLink(proj)}
                    startIcon={isLinked(proj.id) ? <LinkOffOutlined /> : <AddLinkOutlined />}
                    sx={{ width: 130 }}
                  >
                    {isLinked(proj.id) ? "関連付け解除" : "関連付ける"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </OurCard>
  )
}
