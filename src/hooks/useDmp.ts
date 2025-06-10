import { useQuery } from "@tanstack/react-query"

import type { Dmp } from "@/dmp"
import { readDmpFile } from "@/grdmClient"

/**
 * Fetch DMP data using React Query.
 * @param projectId - GRDM project identifier
 * @param token - authentication token
 */
export function useDmp(projectId: string, token: string) {
  return useQuery<Dmp, Error>({
    queryKey: ["dmp", token, projectId],
    queryFn: async () => {
      const res = await readDmpFile(token, projectId)
      return res.dmp
    },
    enabled: Boolean(projectId) && Boolean(token),
  })
}
