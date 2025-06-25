import { FolderSpecialOutlined, FolderOutlined, InsertDriveFileOutlined, ErrorOutline, AddLinkOutlined, LinkOffOutlined, OpenInNew } from "@mui/icons-material"
import { Box, Typography, Card, CircularProgress, Button, Dialog, DialogTitle, DialogContent, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Link, DialogActions } from "@mui/material"
import { SxProps } from "@mui/system"
import { TreeItem, SimpleTreeView } from "@mui/x-tree-view"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { useRecoilValue } from "recoil"

import SectionHeader from "@/components/EditProject/SectionHeader"
import { DmpFormValues, LinkingFile, LinkedGrdmProject } from "@/dmp"
import { listingFileNodes, ProjectInfo } from "@/grdmClient"
import { tokenAtom } from "@/store/token"
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

  // metadata
  size?: number | null
  materialized_path?: string | null
  last_touched?: string | null
  date_modified?: string | null
  date_created?: string | null
  hash_md5?: string | null
  hash_sha256?: string | null
  link?: string | null
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

const findParentNodeInTree = (
  tree: TreeNode[],
  nodeId: string,
): TreeNode | null => {
  for (const node of tree) {
    if (node.children.some((child) => child.nodeId === nodeId)) return node
    const child = findParentNodeInTree(node.children, nodeId)
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

const isAlreadyFetched = (node: TreeNode): boolean => {
  return !(node.children.length === 1 && (node.children[0].type === "loading" || node.children[0].type === "error"))
}

const downloadToLink = (download: string | undefined): string | null => {
  if (!download) return null

  const match = download.match(/\/download\/([^/]+)\/?$/)
  if (!match) return null

  const id = match[1]
  return id.length === 5 ? download.replace("/download", "") : null
}

const fetchFileNodes = async (
  token: string,
  node: TreeNode,
): Promise<TreeNode[]> => {
  if (node.type === "loading" || node.type === "error" || node.type === "file") {
    return []
  }
  const folderNodeId = node.type === "folder" ? node.nodeId : null
  const res = await listingFileNodes(token, node.projectId, folderNodeId)

  return res.data.map((resData) => ({
    projectId: node.projectId,
    nodeId: resData.id,
    label: basename(resData.attributes.materialized_path) ?? resData.id,
    children: resData.attributes.kind === "folder" ? [createLoadingNode(node.projectId)] : [],
    type: resData.attributes.kind as TreeNodeType,
    size: resData.attributes.size,
    materialized_path: resData.attributes.materialized_path,
    last_touched: resData.attributes.last_touched,
    date_modified: resData.attributes.date_modified,
    date_created: resData.attributes.date_created,
    hash_md5: resData.attributes?.extra?.hashes?.md5,
    hash_sha256: resData.attributes?.extra?.hashes?.sha256,
    link: downloadToLink(resData?.links?.download),
  }))
}

const nodeToLinkingFile = (node: TreeNode): LinkingFile => {
  return {
    projectId: node.projectId,
    nodeId: node.nodeId,
    label: node.label,
    size: node.size ?? null,
    materialized_path: node.materialized_path ?? null,
    last_touched: node.last_touched ?? null,
    date_modified: node.date_modified ?? null,
    date_created: node.date_created ?? null,
    hash_md5: node.hash_md5 ?? null,
    hash_sha256: node.hash_sha256 ?? null,
    type: node.type === "file" ? "file" : "folder",
  }
}

const allTreeNode = (tree: FileTree): TreeNode[] => {
  return tree.flatMap((node) => {
    if (node.type === "file" || node.type === "loading" || node.type === "error") {
      return [node]
    }
    return [node, ...allTreeNode(node.children)]
  })
}

export default function FileTreeSection({ sx, projects }: FileTreeSectionProps) {
  const token = useRecoilValue(tokenAtom)
  const linkedProjects = useWatch<DmpFormValues>({
    name: "dmp.linkedGrdmProjects",
    defaultValue: [],
  }) as LinkedGrdmProject[]
  const linkedProjectIds = useMemo(() => linkedProjects.map((p) => p.projectId), [linkedProjects])

  const [tree, setTree] = useState<FileTree>([])
  const [expanded, setExpanded] = useState<string[]>([])
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set())

  // Dialog
  const [openNodeId, setOpenNodeId] = useState<string | null>(null)
  const handleDialogClose = () => setOpenNodeId(null)
  const { control } = useFormContext<DmpFormValues>()
  const { update } = useFieldArray<DmpFormValues, "dmp.dataInfo">({
    control,
    name: "dmp.dataInfo",
  })
  const dataInfos = useWatch<DmpFormValues>({
    name: "dmp.dataInfo",
    defaultValue: [],
  }) as DmpFormValues["dmp"]["dataInfo"]

  // Initialize tree with linked projects
  useEffect(() => {
    setTree((prevTree) => {
      return linkedProjectIds.map((projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return null
        const prevNode = findNodeInTree(prevTree, projectId)
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

  const handleToggle = async (_event: React.SyntheticEvent | null, nodeIds: string[]) => {
    const newlyExpandedNodeId = nodeIds.find((id) => !expanded.includes(id))
    setExpanded(nodeIds)
    if (!newlyExpandedNodeId) return
    if (loadingNodeIds.has(newlyExpandedNodeId)) return

    const node = findNodeInTree(tree, newlyExpandedNodeId)
    if (node === null) return
    if (isAlreadyFetched(node)) return

    setLoadingNodeIds((prev) => new Set(prev).add(node.nodeId))

    fetchFileNodes(token, node)
      .then((fetchedNodes) => {
        setTree((prevTree) => updateNodeInTree(prevTree, node, { children: fetchedNodes }))
      })
      .catch(() => {
        const errorNode = createErrorNode(node.projectId)
        setTree((prevTree) => updateNodeInTree(prevTree, node, { children: [errorNode] }))
      })
      .finally(() => {
        setLoadingNodeIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(node.nodeId)
          return newSet
        })
      })
  }

  const fetchAllChildren = async (node: TreeNode): Promise<TreeNode | null> => {
    if (node.type === "file" || node.type === "loading" || node.type === "error") return node
    if (isAlreadyFetched(node)) {
      await Promise.all(node.children.map(fetchAllChildren))
      return node
    }

    setLoadingNodeIds((prev) => new Set(prev).add(node.nodeId))

    try {
      const fetchedNodes = await fetchFileNodes(token, node)
      const updatedTree = updateNodeInTree(tree, node, { children: fetchedNodes })
      const updatedNode = findNodeInTree(updatedTree, node.nodeId)
      setTree(updatedTree)
      return updatedNode ?? null
    } catch {
      const errorNode = createErrorNode(node.projectId)
      const updatedTree = updateNodeInTree(tree, node, { children: [errorNode] })
      setTree(updatedTree)
      return null
    } finally {
      setLoadingNodeIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(node.nodeId)
        return newSet
      })
    }
  }

  const retryFetch = useCallback((node: TreeNode) => {
    if (node.type !== "error") return
    const parentNode = findParentNodeInTree(tree, node.nodeId)
    if (!parentNode) return

    setLoadingNodeIds((prev) => new Set(prev).add(parentNode.nodeId))

    fetchFileNodes(token, parentNode)
      .then((fetchedNodes) => {
        setTree((prevTree) => updateNodeInTree(prevTree, parentNode, { children: fetchedNodes }))
      })
      .catch(() => {
        const errorNode = createErrorNode(parentNode.projectId)
        setTree((prevTree) => updateNodeInTree(prevTree, parentNode, { children: [errorNode] }))
      })
      .finally(() => {
        setLoadingNodeIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(parentNode.nodeId)
          return newSet
        })
      })
  }, [token, tree])

  const renderTree = useCallback((node: TreeNode): React.ReactNode => {
    const isError = node.type === "error"
    const icon = prefixIcons[node.type]
    const linkedDataInfoNum = dataInfos.filter((f) => f.linkingFiles.some((lf) => lf.nodeId === node.nodeId)).length

    return (
      <TreeItem
        key={node.nodeId}
        itemId={node.nodeId}
        label={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {icon}
              {node.type === "file" && node.link ? (
                <Link
                  href={node.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                    color: "text.primary",
                    fontSize: "0.875rem",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {node.label}
                  <OpenInNew sx={{ fontSize: "1rem" }} />
                </Link>
              ) : (
                <>
                  <Typography color={isError ? "error.main" : "text.primary"} variant="body2">
                    {node.label}
                  </Typography>
                  {node.type === "error" && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        retryFetch(node)
                      }}
                      sx={{
                        p: "4px",
                        height: "24px",
                        ml: "0.5rem",
                      }}
                    >
                      {"再試行"}
                    </Button>
                  )}
                </>
              )}
            </Box>
            {node.type !== "project" && node.type !== "loading" && node.type !== "error" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenNodeId(node.nodeId)
                  }}
                  sx={{
                    p: "4px",
                    height: "24px",
                    width: "8rem",
                  }}
                >
                  <AddLinkOutlined fontSize="inherit" sx={{ mr: "0.5rem" }} />
                  {"関連付ける"}
                </Button>
                <Chip
                  label={`Linked: ${linkedDataInfoNum}`}
                  size="small"
                  sx={{ height: "20px", fontSize: "0.75rem" }}
                />
              </Box>
            )}
          </Box>
        }
      >
        {node.children.map((child) => renderTree(child))}
      </TreeItem>
    )
  }, [dataInfos, setOpenNodeId, retryFetch])

  const renderDialogContent = () => {
    if (openNodeId === null) return null
    const node = findNodeInTree(tree, openNodeId)
    if (!node) return null

    const handleLinkFolderDataInfo = async (dataInfoIndex: number) => {
      const updatedNode = await fetchAllChildren(node)
      if (!updatedNode) return

      const dataInfo = dataInfos[dataInfoIndex]
      const existingNodeIds = dataInfo.linkingFiles.map((f) => f.nodeId)
      const newFiles = allTreeNode([updatedNode])
        .map(nodeToLinkingFile)
        .filter((f) => !existingNodeIds.includes(f.nodeId))
      dataInfo.linkingFiles.push(...newFiles)
      update(dataInfoIndex, dataInfo)
    }
    const handleUnlinkFolderDataInfo = (dataInfoIndex: number) => {
      const removeNodeIds = allTreeNode([node]).map((n) => n.nodeId)
      const dataInfo = dataInfos[dataInfoIndex]
      dataInfo.linkingFiles = dataInfo.linkingFiles.filter((f) => !removeNodeIds.includes(f.nodeId))
      update(dataInfoIndex, dataInfo)
    }

    const handleLinkFileDataInfo = (dataInfoIndex: number) => {
      const dataInfo = dataInfos[dataInfoIndex]
      const existingNodeIds = dataInfo.linkingFiles.map((f) => f.nodeId)
      const newFile = nodeToLinkingFile(node)
      if (!existingNodeIds.includes(newFile.nodeId)) {
        dataInfo.linkingFiles.push(newFile)
        update(dataInfoIndex, dataInfo)
      }
    }

    const handleUnlinkFileDataInfo = (dataInfoIndex: number) => {
      const dataInfo = dataInfos[dataInfoIndex]
      dataInfo.linkingFiles = dataInfo.linkingFiles.filter((f) => f.nodeId !== node.nodeId)
      update(dataInfoIndex, dataInfo)
    }

    const renderFolderButtons = (dataInfoIndex: number) => {
      const loading = loadingNodeIds.has(node.nodeId)
      return (
        <>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => handleLinkFolderDataInfo(dataInfoIndex)}
            startIcon={<AddLinkOutlined />}
            sx={{ width: "130px" }}
            disabled={loading}
          >
            {loading ? "関連付け中" : "関連付ける"}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={() => handleUnlinkFolderDataInfo(dataInfoIndex)}
            startIcon={<LinkOffOutlined />}
            sx={{ width: "130px" }}
          >
            {"関連付け解除"}
          </Button>
        </>
      )
    }

    const renderFileButtons = (dataInfoIndex: number) => {
      const found = dataInfos[dataInfoIndex].linkingFiles.some((f) => f.nodeId === node.nodeId)
      return (
        <Button
          variant="outlined"
          color={found ? "warning" : "primary"}
          size="small"
          onClick={() => {
            if (found) {
              handleUnlinkFileDataInfo(dataInfoIndex)
            } else {
              handleLinkFileDataInfo(dataInfoIndex)
            }
          }}
          startIcon={found ? <LinkOffOutlined /> : <AddLinkOutlined />}
          sx={{ width: "130px" }}
        >
          {found ? "関連付け解除" : "関連付ける"}
        </Button>
      )
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Typography>
          {`"${node.materialized_path}" を関連付ける DMP 研究データを選択してください。`}
        </Typography>
        {node.type === "folder" && (
          <Typography>
            {"フォルダ以下の全てのファイルの関連付けと関連付け解除が可能です。"}
          </Typography>
        )}

        <TableContainer component={Paper} variant="outlined" sx={{
          borderBottom: "none",
          mt: "0.5rem",
          width: "100%",
        }}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
              <TableRow>
                {["名称", "分野", "種別", ""].map((header, index) => (
                  <TableCell
                    key={index}
                    children={header}
                    sx={{ fontWeight: "bold", textAlign: "left", p: "0.5rem 1rem" }}
                  />
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dataInfos.map((dataInfo, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell children={dataInfo.dataName} sx={{ p: "0.5rem 1rem" }} />
                    <TableCell children={dataInfo.researchField} sx={{ p: "0.5rem 1rem" }} />
                    <TableCell children={dataInfo.dataType} sx={{ p: "0.5rem 1rem" }} />
                    <TableCell sx={{ display: "flex", justifyContent: "end", p: "0.5rem 1rem", gap: "1rem" }}>
                      {node.type === "folder" ? (
                        renderFolderButtons(index)
                      ) : (
                        renderFileButtons(index)
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="研究データと GRDM file の関連付け" />
      <Typography sx={{ mt: "0.5rem" }}>
        {"DMP 上で作成した研究データと GRDM Project 上の file との関連付けを行います。"}
      </Typography>
      <Card sx={{ p: "0.5rem", mt: "1rem" }} variant="outlined">
        {tree.length === 0 ? (
          <Typography sx={{ mx: "1rem", my: "0.5rem" }}>
            {"関連付けられた GRDM Project がありません。"}
          </Typography>
        ) : (
          <SimpleTreeView
            expandedItems={expanded}
            onExpandedItemsChange={(e, nodeIds) => handleToggle(e, nodeIds)}
            selectedItems={null}
            onItemClick={() => {
              //do nothing
            }}
            itemChildrenIndentation={24}
          >
            {tree.map((node) => renderTree(node))}
          </SimpleTreeView>
        )}
      </Card>

      <Dialog
        open={openNodeId !== null}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="md"
        closeAfterTransition={false}
      >
        <DialogTitle sx={{ mt: "0.5rem", mx: "1rem" }}>
          {"関連付ける DMP 研究データの選択"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "0.5rem", mx: "1rem" }}>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleDialogClose}
          >
            {"キャンセル"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
