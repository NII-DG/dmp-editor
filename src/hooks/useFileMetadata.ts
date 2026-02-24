import { GrdmClient } from "@hirakinii-packages/grdm-api-typescript"
import type { GrdmFileItem } from "@hirakinii-packages/grdm-api-typescript"
import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { GRDM_CONFIG } from "@/config"
import { tokenAtom } from "@/store/token"

/**
 * Extract file size in bytes from a GrdmFileItem.
 * Uses the active metadata schema's 'grdm-file:file-size' field.
 * Returns null if size is not available or cannot be parsed.
 */
export const extractFileSize = (file: GrdmFileItem): number | null => {
  const activeSchema = file.items.find((item) => item.active)
  if (!activeSchema) return null

  const sizeField = activeSchema["grdm-file:file-size"]
  if (!sizeField) return null

  const value = sizeField.value
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Custom hook to fetch file metadata (including sizes) for a project.
 * Uses the GrdmClient's fileMetadata resource (v1 API).
 * Returns a Map of file path to file size in bytes, or null if unavailable.
 */
export const useFileMetadata = (projectId: string | null | undefined) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<Map<string, number | null> | null, Error>({
    queryKey: ["fileMetadata", token, projectId],
    queryFn: async () => {
      if (!projectId) return null

      const client = new GrdmClient({
        token,
        baseUrl: `${GRDM_CONFIG.API_BASE_URL}/`,
      })

      const response = await client.fileMetadata.getByProject(projectId)

      const sizeMap = new Map<string, number | null>()
      for (const file of response.data.attributes.files) {
        if (!file.folder) {
          sizeMap.set(file.path, extractFileSize(file))
        }
      }

      return sizeMap
    },
    enabled: !!token && !!projectId,
  })
}
