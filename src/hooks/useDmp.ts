import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import type { Dmp } from "@/dmp"
import { readDmpFile } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch the Data Management Plan (DMP) for a GRDM project.
 * AuthHelper guarantees that token is always available.
 * @param projectId - GRDM project identifier
 */
export function useDmp(projectId: string) {
  const token = useRecoilValue(tokenAtom)

  return useQuery<Dmp, Error>({
    queryKey: ["dmp", token, projectId],
    queryFn: async () => {
      const res = await readDmpFile(token, projectId)
      return res.dmp
    },
    enabled: !!token && !!projectId,
  })
}
