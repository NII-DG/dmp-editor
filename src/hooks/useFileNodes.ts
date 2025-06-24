import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { listingFileNodes } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

export interface FileNode {
  nodeId: string
  type: "file" | "folder"
  size?: number | null
  materialized_path?: string // Unix-style path like /something_dir/
  last_touched?: string | null
  date_modified?: string | null
  date_created?: string | null
  extra?: {
    hashes: {
      md5: string | null
      sha256: string | null
    }
  }
}

/**
 * Custom hook to fetch file nodes for a project.
 * AuthHelper guarantees that token is always available.
 */
export const useFileNodes = (projectId: string | null, nodeId: string | null, type: "file" | "folder" | "project" | null) => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<FileNode[], Error>({
    queryKey: ["fileNodes", token, projectId, nodeId, type],
    queryFn: async () => {
      if (!projectId || !type) return []
      if (type === "file") return []
      const folderNodeId = type === "folder" ? nodeId : null
      const res = await listingFileNodes(token, projectId, folderNodeId)
      return res.data.map((node) => ({
        nodeId: node.id,
        type: node.attributes.kind,
        size: node.attributes.size,
        materialized_path: node.attributes.materialized_path,
        last_touched: node.attributes.last_touched,
        date_modified: node.attributes.date_modified,
        date_created: node.attributes.date_created,
        extra: node.attributes.extra,
      }))
    },
    enabled: !!token && !!projectId && !!nodeId && !!type,
  })
}
