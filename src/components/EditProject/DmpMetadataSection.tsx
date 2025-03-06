import { Box, TextField, FormControl, Select, MenuItem } from "@mui/material"
import { SxProps } from "@mui/system"
import { useEffect, useState } from "react"
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { revisionType, todayString, DmpMetadata, RevisionType } from "@/dmp"
import { formValidationStateAtom, dmpAtom, submitTriggerAtom } from "@/store/dmp"

interface DmpMetadataSectionProps {
  sx?: SxProps
}

export default function DmpMetadataSection({ sx }: DmpMetadataSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const setFormValidationState = useSetRecoilState(formValidationStateAtom)
  const [error, setError] = useState<Record<keyof DmpMetadata, string | null>>({
    revisionType: null,
    submissionDate: null,
    dateCreated: null,
    dateModified: null,
  })
  const submitTrigger = useRecoilValue(submitTriggerAtom)

  const updateDmpMetadata = <K extends keyof DmpMetadata>(
    key: K,
    value: DmpMetadata[K],
  ) => {
    setDmp((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }))
  }

  const updateError = <K extends keyof DmpMetadata>(key: K, value: string | null) => {
    setError((prev) => ({
      ...prev,
      [key]: value,
    }))
    setFormValidationState((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value === null,
      },
    }))
  }

  // Set initial values
  useEffect(() => {
    updateDmpMetadata("submissionDate", todayString())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const validateValue = <K extends keyof DmpMetadata>(
    key: K,
    value: DmpMetadata[K],
  ): void => {
    if (value === "") {
      updateError(key, "必須項目です")
      return
    }

    updateError(key, null)
  }

  const changeValue = <K extends keyof DmpMetadata>(
    key: K,
    value: DmpMetadata[K],
  ) => {
    updateDmpMetadata(key, value)
    validateValue(key, value)
  }

  // Click submit button
  useEffect(() => {
    if (submitTrigger === 0) return
    for (const key of Object.keys(error) as (keyof DmpMetadata)[]) {
      validateValue(key, dmp.metadata[key])
    }
  }, [submitTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP 作成・更新情報" />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "1rem" }}>
        <FormControl fullWidth>
          <OurFormLabel label="種別" required />
          <Select
            variant="outlined"
            value={dmp.metadata.revisionType}
            onChange={(e) => changeValue("revisionType", e.target.value as RevisionType)}
            error={!!error.revisionType}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
          >
            {revisionType.map((type) => (
              <MenuItem key={type} value={type} children={type} />
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="提出日" required />
          <TextField
            variant="outlined"
            value={dmp.metadata.submissionDate}
            onChange={(e) => changeValue("submissionDate", e.target.value)}
            error={!!error.submissionDate}
            helperText={error.submissionDate}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
            type="date"
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="DMP 作成年月日" required />
          <TextField
            variant="outlined"
            value={dmp.metadata.dateCreated}
            onChange={(e) => changeValue("dateCreated", e.target.value)}
            error={!!error.dateCreated}
            helperText={error.dateCreated}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
            type="date"
          />
        </FormControl>

        <FormControl fullWidth>
          <OurFormLabel label="DMP 最終更新年月日" required />
          <TextField
            variant="outlined"
            value={dmp.metadata.dateModified}
            onChange={(e) => changeValue("dateModified", e.target.value)}
            error={!!error.dateModified}
            helperText={error.dateModified}
            sx={{ maxWidth: "480px" }}
            size="small"
            fullWidth
            type="date"
          />
        </FormControl>
      </Box>
    </Box>
  )
}
