import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { listingProjects, ProjectInfo } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch projects.
 * AuthHelper guarantees that token is always available,
 * so queries are always enabled.
 */
export const useProjects = () => {
  const token = useRecoilValue(tokenAtom)
  return useQuery<ProjectInfo[], Error>({
    queryKey: ["projects", token],
    queryFn: () => listingProjects(token),
    enabled: true,
    staleTime: Infinity,
    refetchOnMount: "always",
  })
}
