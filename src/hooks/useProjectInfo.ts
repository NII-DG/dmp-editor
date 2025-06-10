import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { getProjectInfo, ProjectInfo } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch project information.
 * Wraps React Query getProjectInfo and returns
 * { data, isLoading, isError }.
 */
export const useProjectInfo = (projectId: string) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<ProjectInfo, Error>({
    queryKey: ["projectInfo", token, projectId],
    queryFn: () => {
      if (!token) {
        return Promise.reject(new Error("No token available"))
      }
      return getProjectInfo(token, projectId)
    },
    enabled: Boolean(token) && Boolean(projectId),
    staleTime: Infinity,
    refetchOnMount: "always",
  })
}
