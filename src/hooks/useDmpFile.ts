import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import type { Dmp } from "@/dmp"
import type { FilesNode } from "@/grdmClient"
import { readDmpFile } from "@/grdmClient"
import { dmpAtom } from "@/store/dmp"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch and manage DMP file state.
 * - If isNewParam is false, fetches DMP via readDmpFile and updates Recoil dmpAtom.
 * - Returns DMP state, isNew flag, and loading/error status.
 */
export const useDmpFile = (projectId: string, isNewParam = false) => {
  const token = useRecoilValue(tokenAtom)
  const setDmp = useSetRecoilState(dmpAtom)

  const query = useQuery<{ dmp: Dmp; node: FilesNode }, Error>({
    queryKey: ["dmpFile", token, projectId],
    queryFn: async () => {
      if (!token) {
        throw new Error("No token available")
      }
      return readDmpFile(token, projectId)
    },
    enabled: Boolean(token) && !isNewParam,
    staleTime: Infinity,
    refetchOnMount: "always",
  })

  useEffect(() => {
    if (query.data?.dmp) {
      setDmp(query.data.dmp)
    }
  }, [query.data, setDmp])

  return {
    dmp: query.data?.dmp ?? null,
    isNew: isNewParam,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
