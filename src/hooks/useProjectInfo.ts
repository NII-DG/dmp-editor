import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { getProjectInfo, ProjectInfo } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch project information.
 * AuthHelper guarantees that token is always available.
 * @param projectId - The ID of the project to fetch information for.
 */
export const useProjectInfo = (projectId: string, isNew = false) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<ProjectInfo | null, Error>({
    queryKey: ["projectInfo", token, projectId],
    queryFn: () => {
      if (isNew) return null // Return null for new projects

      return getProjectInfo(token, projectId)
    },
    enabled: !!token && !!projectId,
  })
}
