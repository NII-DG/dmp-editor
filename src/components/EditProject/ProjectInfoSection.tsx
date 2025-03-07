import { Box, TextField, FormControl, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { ProjectInfo } from "@/dmp"
import { formValidationStateAtom, dmpAtom, submitTriggerAtom } from "@/store/dmp"

interface ProjectInfoSectionProps {
  sx?: SxProps
}

export default function ProjectInfoSection({ sx }: ProjectInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const setFormValidationState = useSetRecoilState(formValidationStateAtom)
  const [error, setError] = useState<Record<keyof ProjectInfo, string | null>>({
    fundingAgency: null,
    programName: null,
    programCode: null,
    projectCode: null,
    projectName: null,
    adoptionYear: null,
    startYear: null,
    endYear: null,
  })
  const submitTrigger = useRecoilValue(submitTriggerAtom)

  const updateProjectInfo = <K extends keyof ProjectInfo>(
    key: K,
    value: ProjectInfo[K],
  ) => {
    setDmp((prev) => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [key]: value,
      },
    }))
  }

  const updateError = <K extends keyof ProjectInfo>(key: K, value: string | null) => {
    setError((prev) => ({
      ...prev,
      [key]: value,
    }))
    setFormValidationState((prev) => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [key]: value === null,
      },
    }))
  }

  // Set initial values
  useEffect(() => {
    // do nothing
  }, [])

  const REQUIRED_KEYS: (keyof ProjectInfo)[] = ["fundingAgency", "projectCode", "projectName"] as const

  const validateValue = <K extends keyof ProjectInfo>(
    key: K,
    value: ProjectInfo[K],
  ): void => {
    if (REQUIRED_KEYS.includes(key) && value === "") {
      updateError(key, "必須項目です")
      return
    }

    updateError(key, null)
  }

  const changeValue = <K extends keyof ProjectInfo>(
    key: K,
    value: ProjectInfo[K],
  ) => {
    updateProjectInfo(key, value)
    validateValue(key, value)
  }

  // Click submit button
  useEffect(() => {
    if (submitTrigger === 0) return
    for (const key of Object.keys(error) as (keyof ProjectInfo)[]) {
      validateValue(key, dmp.projectInfo[key])
    }
  }, [submitTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="プロジェクト情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        <FormControl fullWidth>
          <OurFormLabel label="資金配分機関情報" required />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.fundingAgency}
            onChange={(e) => changeValue("fundingAgency", e.target.value)}
            error={!!error.fundingAgency}
            helperText={error.fundingAgency}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <OurFormLabel label="プログラム名 (事業名・種目名)" />
            <HelpChip
              text={
                <>
                  {"NISTEP 体系的番号一覧 ("}
                  <Link href="https://www.nistep.go.jp/taikei" target="_blank" rel="noopener" children="https://www.nistep.go.jp/taikei" />
                  {") に掲載されている「事業・制度名」を記載してください。"}
                </>
              }
            />
          </Box>
          <TextField
            variant="outlined"
            value={dmp.projectInfo.programName}
            onChange={(e) => changeValue("programName", e.target.value)}
            error={!!error.programName}
            helperText={error.programName}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <OurFormLabel label="体系的番号におけるプログラム情報コード" />
            <HelpChip
              text={
                <>
                  {"NISTEP 体系的番号一覧 ("}
                  <Link href="https://www.nistep.go.jp/taikei" target="_blank" rel="noopener" children="https://www.nistep.go.jp/taikei" />
                  {") に掲載されている「機関コード」および「施策・事業の特定コード」を表すコードを記載してください。"}
                </>
              }
            />
          </Box>
          <TextField
            variant="outlined"
            value={dmp.projectInfo.programCode}
            onChange={(e) => changeValue("programCode", e.target.value)}
            error={!!error.programCode}
            helperText={error.programCode}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="体系的番号" required />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.projectCode}
            onChange={(e) => changeValue("projectCode", e.target.value)}
            error={!!error.projectCode}
            helperText={error.projectCode}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="プロジェクト名" required />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.projectName}
            onChange={(e) => changeValue("projectName", e.target.value)}
            error={!!error.projectName}
            helperText={error.projectName}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="採択年度" />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.adoptionYear}
            onChange={(e) => changeValue("adoptionYear", e.target.value)}
            error={!!error.adoptionYear}
            helperText={error.adoptionYear}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="事業開始年度" />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.startYear}
            onChange={(e) => changeValue("startYear", e.target.value)}
            error={!!error.startYear}
            helperText={error.startYear}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="事業終了年度" />
          <TextField
            variant="outlined"
            value={dmp.projectInfo.endYear}
            onChange={(e) => changeValue("endYear", e.target.value)}
            error={!!error.endYear}
            helperText={error.endYear}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          />
        </FormControl>
      </Box>
    </Box>
  )
}
