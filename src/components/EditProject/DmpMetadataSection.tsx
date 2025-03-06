import { Box, TextField, Typography } from "@mui/material"
import { SxProps } from "@mui/system"
import { useRecoilState } from "recoil"

import SectionHeader from "@/components/EditProject/SectionHeader"
import { dmpAtom } from "@/store/dmp"

interface DmpMetadataSectionProps {
  sx?: SxProps
}

export default function DmpMetadataSection({ sx }: DmpMetadataSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)

  const changeSubmissionDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDmp((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        submissionDate: newValue,
      },
    }))
  }

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="DMP 作成・更新情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box>
          <Typography
            sx={{ fontSize: "0.9rem", mb: "0.25rem" }}
            children="提出日"
          />
          <TextField
            variant="outlined"
            value={dmp.metadata.submissionDate}
            onChange={changeSubmissionDate}
            sx={{ width: "100%" }}
          />
        </Box>
      </Box>
    </Box>
  )
}
