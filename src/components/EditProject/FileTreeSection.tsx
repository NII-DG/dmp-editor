import { FolderSpecialOutlined, FolderOutlined, InsertDriveFileOutlined, ErrorOutline } from "@mui/icons-material"
import { Box, Typography, Card, CircularProgress } from "@mui/material"
import { SxProps } from "@mui/system"
import { TreeItem, SimpleTreeView } from "@mui/x-tree-view"
import React, { useEffect, useMemo, useState } from "react"
import { useWatch } from "react-hook-form"

import SectionHeader from "@/components/EditProject/SectionHeader"
import { DmpFormValues, LinkedGrdmProject } from "@/dmp"
import { ProjectInfo } from "@/grdmClient"
import { useFileNodes } from "@/hooks/useFileNodes"
import { theme } from "@/theme"

interface FileTreeSectionProps {
  sx?: SxProps
  projects: ProjectInfo[]
}

type TreeNodeType = "file" | "folder" | "project" | "loading" | "error"
interface TreeNode {
  projectId: string
  nodeId: string
  label: string
  children: TreeNode[]
  type: TreeNodeType
}
type FileTree = TreeNode[]

const updateNodeInTree = (
  tree: TreeNode[],
  activeNode: TreeNode,
  updates: Partial<TreeNode>,
): TreeNode[] => {
  return tree.map((node) => {
    if (node.nodeId === activeNode.nodeId) {
      return { ...node, ...updates }
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, activeNode, updates),
      }
    }
    return node
  })
}

const findNodeInTree = (
  tree: TreeNode[],
  nodeId: string,
): TreeNode | null => {
  for (const node of tree) {
    if (node.nodeId === nodeId) return node
    const child = findNodeInTree(node.children, nodeId)
    if (child) return child
  }
  return null
}

const createLoadingNode = (projectId: string): TreeNode => ({
  projectId,
  nodeId: `loading-${crypto.randomUUID()}`,
  label: "Loading...",
  children: [],
  type: "loading",
})

const createErrorNode = (projectId: string): TreeNode => ({
  projectId,
  nodeId: `error-${crypto.randomUUID()}`,
  label: "読み込みエラーが発生しました",
  children: [],
  type: "error",
})

const prefixIcons = {
  project: <FolderSpecialOutlined fontSize="small" sx={{ color: theme.palette.grey[700] }} />,
  folder: <FolderOutlined fontSize="small" sx={{ color: theme.palette.grey[700] }} />,
  file: <InsertDriveFileOutlined fontSize="small" sx={{ color: theme.palette.grey[700] }} />,
  loading: <CircularProgress size={16} sx={{ color: theme.palette.grey[700] }} />,
  error: <ErrorOutline fontSize="small" sx={{ color: theme.palette.error.main }} />,
}

const basename = (path: string | undefined): string | undefined => {
  if (!path) return undefined
  const trimmed = path.replace(/^\//, "").replace(/\/$/, "")
  const parts = trimmed.split("/")
  return parts.length > 0 ? parts[parts.length - 1] : ""
}

export default function FileTreeSection({ sx, projects }: FileTreeSectionProps) {
  const linkedProjects = useWatch<DmpFormValues>({
    name: "dmp.linkedGrdmProjects",
    defaultValue: [],
  })
  const linkedProjectIds = useMemo(
    () => (linkedProjects as LinkedGrdmProject[]).map((p) => p.projectId) ?? [],
    [linkedProjects],
  )
  const [tree, setTree] = useState<FileTree>([])
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null)
  const fileNodesQuery = useFileNodes(
    activeNode?.projectId ?? null,
    activeNode?.nodeId ?? null,
    (activeNode && (activeNode.type === "file" || activeNode.type === "folder" || activeNode.type === "project"))
      ? activeNode.type
      : null,
  )

  const [expanded, setExpanded] = useState<string[]>([])
  const handleToggle = (_event: React.SyntheticEvent | null, nodeIds: string[]) => {
    const newlyExpanded = nodeIds.find((id) => !expanded.includes(id))
    if (newlyExpanded) {
      const node = findNodeInTree(tree, newlyExpanded)
      if (node && node.children.length === 1 && node.children[0].type === "loading") {
        setActiveNode(node)
      }
    }
    setExpanded(nodeIds)
  }

  // Initialize tree with linked projects
  useEffect(() => {
    setTree((prevTree) => {
      return linkedProjectIds.map((projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return null

        const prevNode = findNodeInTree(prevTree, projectId)
        console.log("Called with projectId:", projectId, "prevNode:", prevNode)
        const children = prevNode?.children && prevNode.children.length > 0
          ? prevNode.children
          : [createLoadingNode(projectId)]
        return {
          projectId,
          nodeId: projectId,
          label: project.title,
          children,
          type: "project" as TreeNodeType,
        }
      }).filter((node) => node !== null)
    })
  }, [linkedProjectIds, projects])

  // Update tree (fetch children data) when activeNode changes
  useEffect(() => {
    if (!activeNode) return

    if (fileNodesQuery.isError) {
      const errorNode = createErrorNode(activeNode.projectId)
      setTree((prevTree) => updateNodeInTree(prevTree, activeNode, { children: [errorNode] }))
      setActiveNode(null)
      return
    }

    if (fileNodesQuery.data) {
      console.log("Called with activeNode:", activeNode, "fileNodesQuery.data:", fileNodesQuery.data)
      const children: TreeNode[] = fileNodesQuery.data.map((f) => ({
        projectId: activeNode.projectId,
        nodeId: f.nodeId,
        label: basename(f.materialized_path) ?? f.nodeId,
        children: f.type === "folder" ? [createLoadingNode(activeNode.projectId)] : [],
        type: f.type as TreeNodeType,
      }))
      setTree((prevTree) =>
        updateNodeInTree(prevTree, activeNode, {
          children,
        }),
      )
      setActiveNode(null)
    }
  }, [activeNode, fileNodesQuery.isError, fileNodesQuery.data])

  const renderTree = (node: TreeNode): React.ReactNode => {
    const isError = node.type === "error"
    const icon = prefixIcons[node.type]
    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {icon}
            <Typography color={isError ? "error.main" : "text.primary"} variant="body2">
              {node.label}
            </Typography>
          </Box>
        }
      >
        {node.children.map((child) => renderTree(child))}
      </TreeItem>
    )
  }

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="他の GRDM Project との関連付け" />
      <Typography sx={{ mt: "0.5rem" }}>
        {"上部で作成した研究データと GRDM 上の file との関連付けが行えます。"}
      </Typography>
      <Card sx={{ p: "0.5rem", mt: "1rem" }} variant="outlined">
        <SimpleTreeView
          expandedItems={expanded}
          onExpandedItemsChange={handleToggle}
          selectedItems={null}
          onItemClick={() => {
            //do nothing
          }}
          itemChildrenIndentation={24}
        >
          {tree.map((node) => renderTree(node))}
        </SimpleTreeView>
      </Card>
    </Box>
  )
}
