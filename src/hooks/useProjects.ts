import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { listingProjects, ProjectInfo } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch projects.
 * AuthHelper guarantees that token is always available.
 */
export const useProjects = (fetch = true) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<ProjectInfo[], Error>({
    queryKey: ["projects", token],
    queryFn: () => {
      if (!fetch) return []

      return listingProjects(token)
    },
    enabled: !!token,
  })
}
