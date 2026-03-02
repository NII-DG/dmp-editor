import { GrdmClient } from "@hirakinii-packages/grdm-api-typescript"
import type { GrdmProjectMetadataAttributes, TransformedList } from "@hirakinii-packages/grdm-api-typescript"
import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { GRDM_CONFIG } from "@/config"
import { tokenAtom } from "@/store/token"

/**
 * Custom hook to fetch GRDM project metadata (registrations) for a node.
 * Uses GrdmClient.projectMetadata.listByNode (v2 API).
 * Returns the raw TransformedList response for the caller to consume.
 */
export const useGrdmProjectMetadata = (nodeId: string | null | undefined) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<TransformedList<GrdmProjectMetadataAttributes> | null, Error>({
    queryKey: ["grdmProjectMetadata", token, nodeId],
    queryFn: async () => {
      if (!nodeId) return null

      const client = new GrdmClient({
        token,
        baseUrl: `${GRDM_CONFIG.API_BASE_URL}/`,
      })

      return client.projectMetadata.listByNode(nodeId)
    },
    enabled: !!token && !!nodeId,
  })
}
