import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { listingProjects, ProjectInfo, DMP_PROJECT_PREFIX } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch projects.
 * AuthHelper guarantees that token is always available.
 */
export const useDmpProjects = () => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<ProjectInfo[], Error>({
    queryKey: ["projects", token],
    queryFn: () => listingProjects(token, DMP_PROJECT_PREFIX),
    enabled: !!token,
  })
}
