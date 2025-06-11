import { Box, Button } from "@mui/material"
import { useForm, FormProvider } from "react-hook-form"
import { useParams } from "react-router-dom"
import { useRecoilValue } from "recoil"

import DataInfoSection from "@/components/EditProject/DataInfoSection"
import DmpMetadataSection from "@/components/EditProject/DmpMetadataSection"
import ExportDmpCard from "@/components/EditProject/ExportDmpCard"
import ProjectInfoSection from "@/components/EditProject/ProjectInfoSection"
import SectionHeader from "@/components/EditProject/SectionHeader"
import Frame from "@/components/Frame"
import Loading from "@/components/Loading"
import type { Dmp } from "@/dmp"
import { useAuth } from "@/hooks/useAuth"
import { useDmp } from "@/hooks/useDmp"
// import { useUpdateDmp } from "@/hooks/useUpdateDmp"
import { tokenAtom } from "@/store/token"

interface EditProjectProps {
  isNew?: boolean
}

export default function EditProject({ isNew }: EditProjectProps) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const { data: dmp, isLoading, error } = useDmp(projectId)
  const updateMutation = useUpdateDmp(projectId, token)

  const methods = useForm<Dmp>({
    defaultValues: dmp,
    mode: "onChange",
  })

  if (isLoading || !dmp) {
    return (
      <Frame noAuth>
        <Loading msg="Loading..." />
      </Frame>
    )
  }

  if (error) throw error

  return (
    <Frame>
      <FormProvider {...methods}>
        <Box
          component="form"
          onSubmit={methods.handleSubmit((values) =>
            updateMutation.mutate(values),
          )}
        >
          <SectionHeader text="DMP 作成・更新情報" />
          <DmpMetadataSection />

          <SectionHeader text="Project Info" />
          <ProjectInfoSection />

          <SectionHeader text="Data Info" />
          <DataInfoSection />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button type="submit" variant="contained" color="primary">
              保存
            </Button>
          </Box>
        </Box>
        <Box sx={{ mt: 4 }}>
          <ExportDmpCard />
        </Box>
      </FormProvider>
    </Frame>
  )
}
