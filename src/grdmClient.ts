import { z } from "zod"

import { Dmp, dmpSchema } from "@/dmp"

export const DMP_FILE_NAME = "dmp-project.json"
export const DMP_PROJECT_PREFIX = "dmp-project-"
const GRDM_API_BASE_URL = "https://api.rdm.nii.ac.jp/v2"

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 5,
  timeout = 10000, // 10 seconds
): Promise<Response> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      if (response.status === 429) {
        if (attempt < retries) {
          console.warn("Too many requests (429) - Retrying in 1s")
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        } else {
          throw new Error("Too many requests (429) - Max retries exceeded")
        }
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (attempt < retries) {
        console.warn("Failed to fetch - Retrying in 1s", error)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      } else {
        throw error
      }
    }
  }

  throw new Error("Unreachable code reached")
}

export const authenticateGrdm = async (token: string): Promise<boolean> => {
  const url = `${GRDM_API_BASE_URL}/users/me/`

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    return response.ok
  } catch (error) {
    throw new Error("Failed to authenticate with GRDM API", { cause: error })
  }
}

export interface GetMeResponse {
  data: {
    id: string
    attributes: {
      full_name: string
      given_name: string
      family_name: string
      social: {
        orcid: string
        researcherId: string
      }
      employment: {
        institution_ja: string
        department_ja: string
      }[]
      timezone: string
      email: string
    }
    links: {
      html: string
      profile_image: string
    }
  }
}

export const getMeResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      full_name: z.string(),
      given_name: z.string(),
      family_name: z.string(),
      social: z.object({
        orcid: z.string(),
        researcherId: z.string(),
      }),
      employment: z.array(z.object({
        institution_ja: z.string(),
        department_ja: z.string(),
      })),
      timezone: z.string(),
      email: z.string(),
    }),
    links: z.object({
      html: z.string(),
      profile_image: z.string(),
    }),
  }),
})

export const getMe = async (token: string): Promise<GetMeResponse> => {
  const url = `${GRDM_API_BASE_URL}/users/me/`

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }
    const json = await response.json()

    return getMeResponseSchema.parse(json)
  } catch (error) {
    throw new Error("Failed to get user information from GRDM", { cause: error })
  }
}

export interface NodeData {
  id: string
  type: "nodes"
  attributes: {
    title: string
    description: string
    category: string
    date_created: string // "2023-07-04T04:08:12.597030"
    date_modified: string // "2023-07-04T04:08:12.597030"
  }
  relationships: Record<string, {
    links: {
      related: {
        href: string
      }
    }
  }>
  links: {
    html: string
    self: string
  }
}

export const nodeDataSchema = z.object({
  id: z.string(),
  type: z.literal("nodes"),
  attributes: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    date_created: z.string(),
    date_modified: z.string(),
  }),
  relationships: z.record(
    z.object({
      links: z.object({
        related: z.object({
          href: z.string(),
        }),
      }),
    })),
  links: z.object({
    html: z.string(),
    self: z.string(),
  }),
})

export interface GetNodesResponse {
  data: NodeData[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
    meta: {
      total: number
      per_page: number
    }
  }
}

export const getNodesResponseSchema = z.object({
  data: z.array(nodeDataSchema),
  links: z.object({
    first: z.string().nullable(),
    last: z.string().nullable(),
    prev: z.string().nullable(),
    next: z.string().nullable(),
    meta: z.object({
      total: z.number(),
      per_page: z.number(),
    }),
  }),
})

export const getNodes = async (token: string, followPagination = false): Promise<GetNodesResponse> => {
  const url = `${GRDM_API_BASE_URL}/nodes/`
  let allData: GetNodesResponse["data"] = []
  let nextUrl: string | null = url

  try {
    while (nextUrl) {
      const response = await fetchWithRetry(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }
      const json = await response.json()
      const parsed = getNodesResponseSchema.parse(json)

      allData = [...allData, ...parsed.data]
      nextUrl = followPagination ? parsed.links.next : null
    }

    return {
      data: allData,
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
        meta: {
          total: allData.length,
          per_page: allData.length,
        },
      },
    }
  } catch (error) {
    throw new Error("Failed to list nodes from GRDM", { cause: error })
  }
}

export interface ProjectInfo {
  id: string
  type: string
  title: string
  description: string
  category: string
  dateCreated: string // "2023-07-04T04:08:12.597030"
  dateModified: string // "2023-07-04T04:08:12.597030"
  html: string
  self: string
}

const nodeToProjectInfo = (node: NodeData): ProjectInfo => ({
  id: node.id,
  type: node.type,
  title: node.attributes.title,
  description: node.attributes.description,
  category: node.attributes.category,
  dateCreated: node.attributes.date_created,
  dateModified: node.attributes.date_modified,
  html: node.links.html,
  self: node.links.self,
})

export const listingProjects = async (token: string): Promise<ProjectInfo[]> => {
  const response = await getNodes(token, true)
  return response.data
    .map((node) => (nodeToProjectInfo(node)))
    .filter((project) => project.category === "project")
}

export const formatDateToTimezone = (dateString: string, timeZone = "Asia/Tokyo"): string => {
  const date = new Date(dateString)

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export interface GetProjectResponse {
  data: NodeData
}

export const getProjectResponseSchema = z.object({
  data: nodeDataSchema,
})

export const getProject = async (token: string, projectId: string): Promise<GetProjectResponse> => {
  const url = `${GRDM_API_BASE_URL}/nodes/${projectId}/`

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }
    const json = await response.json()

    return getProjectResponseSchema.parse(json)
  } catch (error) {
    console.error("Failed to get project from GRDM", error)
    throw error
  }
}

export const getProjectInfo = async (token: string, projectId: string): Promise<ProjectInfo> => {
  try {
    const response = await getProject(token, projectId)
    return nodeToProjectInfo(response.data)
  } catch (error) {
    throw new Error("Failed to get project information", { cause: error })
  }
}

export interface FilesNode {
  id: string
  type: "files"
  attributes: {
    name: string
    kind: "file" | "folder"
    path: string // unique identifier like /<id>/
    size?: number | null // bytes
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
    current_version?: number
  }
  relationships: Record<string, { // key: e.g., files
    links: {
      related: {
        href: string
      }
    }
  }>
  links: {
    info?: string
    self?: string
    move?: string
    new_folder?: string
    upload?: string
    download?: string
    delete?: string
  }
}

export const filesNodeSchema = z.object({
  id: z.string(),
  type: z.literal("files"),
  attributes: z.object({
    name: z.string(),
    kind: z.enum(["file", "folder"]),
    path: z.string(),
    size: z.number().nullable().optional(),
    materialized_path: z.string().optional(),
    last_touched: z.string().nullable().optional(),
    date_modified: z.string().nullable().optional(),
    date_created: z.string().nullable().optional(),
    extra: z.object({
      hashes: z.object({
        md5: z.string().nullable(),
        sha256: z.string().nullable(),
      }),
    }).optional(),
    current_version: z.number().optional(),
  }),
  relationships: z.record(
    z.object({
      links: z.object({
        related: z.object({
          href: z.string(),
        }),
      }),
    }),
  ),
  links: z.object({
    info: z.string().optional(),
    self: z.string().optional(),
    move: z.string().optional(),
    new_folder: z.string().optional(),
    upload: z.string().optional(),
    download: z.string().optional(),
    delete: z.string().optional(),
  }),
})

export interface GetFilesResponse {
  data: FilesNode[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
    meta: {
      total: number
      per_page: number
    }
  }
}

export const getFilesResponseSchema = z.object({
  data: z.array(filesNodeSchema),
  links: z.object({
    first: z.string().nullable(),
    last: z.string().nullable(),
    prev: z.string().nullable(),
    next: z.string().nullable(),
    meta: z.object({
      total: z.number(),
      per_page: z.number(),
    }),
  }),
})

export const getFiles = async (token: string, url: string, followPagination = false): Promise<GetFilesResponse> => {
  let allData: GetFilesResponse["data"] = []
  let nextUrl: string | null = url

  try {
    while (nextUrl) {
      const response = await fetchWithRetry(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }
      const json = await response.json()
      const parsed = getFilesResponseSchema.parse(json)

      allData = [...allData, ...parsed.data]
      nextUrl = followPagination ? parsed.links.next : null
    }

    return {
      data: allData,
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
        meta: {
          total: allData.length,
          per_page: allData.length,
        },
      },
    }
  } catch (error) {
    throw new Error("Failed to list files from GRDM", { cause: error })
  }
}

const findFilesNodeFromDataList = (nodes: GetFilesResponse["data"], pathName: string): FilesNode | null => {
  return nodes.find((node) => node.attributes.name === pathName) ?? null
}

export const findFilesNode = async (token: string, projectId: string, path: string): Promise<FilesNode> => {
  try {
    const pathArray = path.replace(/^\/+|\/+$/g, "").split("/")

    // Get the root node of the project (from osfstorage)
    let currentUrl = `${GRDM_API_BASE_URL}/nodes/${projectId}/files/osfstorage/`
    let currentNodeList = await getFiles(token, currentUrl, true)
    let currentNode: FilesNode | null = null
    for (const [index, pathName] of pathArray.entries()) {
      currentNode = findFilesNodeFromDataList(currentNodeList.data, pathName)
      if (currentNode === null) {
        throw new Error(`Failed to find node: ${pathArray.slice(0, index + 1).join("/")}`)
      }

      if (index !== pathArray.length - 1) {
        if (currentNode.attributes.kind !== "folder") {
          throw new Error(`Expected a folder but found a file: ${pathArray.slice(0, index + 1).join("/")}`)
        }
        currentUrl = currentNode.relationships.files?.links.related.href ?? ""
        if (currentUrl === "") {
          throw new Error(`No files relationship found for node: ${pathArray.slice(0, index + 1).join("/")}`)
        }
        currentNodeList = await getFiles(token, currentUrl, true)
      }
    }

    if (currentNode === null) {
      throw new Error("Failed to find node: ${path}")
    }

    return currentNode
  } catch (error) {
    throw new Error("Failed to find files node", { cause: error })
  }
}

export const readFile = async (token: string, projectId: string, path: string): Promise<{
  content: string
  node: FilesNode
}> => {
  // path: e.g., path/to/file.txt (no leading or trailing slashes)
  try {
    const node = await findFilesNode(token, projectId, path)
    if (node.attributes.kind !== "file") {
      throw new Error(`Expected a file but found a folder: ${path}`)
    }

    const url = node.links.move ?? node.links.upload ?? node.links.delete
    if (url === undefined) {
      throw new Error(`No download link found for file: ${path}`)
    }

    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }

    return {
      content: await response.text(),
      node,
    }
  } catch (error) {
    throw new Error("Failed to read file", { cause: error })
  }
}

export const writeFile = async (token: string, projectId: string, path: string, content: string, update = true): Promise<void> => {
  try {
    const pathArray = path.replace(/^\/+|\/+$/g, "").split("/")
    const fileName = pathArray.pop()
    if (fileName === undefined) {
      throw new Error(`Invalid file path: ${path}`)
    }

    // root node of the project (from osfstorage)
    const rootUrl = `${GRDM_API_BASE_URL}/nodes/${projectId}/files/`
    const rootNodeList = await getFiles(token, rootUrl, true)
    const osfStorageNode = findFilesNodeFromDataList(rootNodeList.data, "osfstorage")
    if (osfStorageNode === null) {
      throw new Error("Failed to find osfstorage node")
    }

    let currentUrl = `${GRDM_API_BASE_URL}/nodes/${projectId}/files/osfstorage/`
    let currentNodeList = await getFiles(token, currentUrl, true)
    let parentNode: FilesNode | null = osfStorageNode

    for (const [index, pathName] of pathArray.entries()) {
      const foundNode = findFilesNodeFromDataList(currentNodeList.data, pathName)
      if (foundNode !== null) {
        parentNode = foundNode
        currentUrl = foundNode.relationships.files?.links.related.href ?? ""
        if (currentUrl === "") {
          throw new Error(`No files relationship found for node: ${pathArray.slice(0, index + 1).join("/")}`)
        }
        currentNodeList = await getFiles(token, currentUrl, true)
      } else {
        // Node not found, create a new node (directory)
        if (parentNode === null || parentNode.links.new_folder === undefined) {
          throw new Error(`Cannot create directory: ${pathArray.slice(0, index + 1).join("/")}`)
        }

        const newFolderUrlObj = new URL(parentNode.links.new_folder)
        newFolderUrlObj.searchParams.set("name", pathName)
        const createDirResponse = await fetchWithRetry(newFolderUrlObj.toString(), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!createDirResponse.ok) {
          throw new Error(`Failed to create directory: ${pathArray.slice(0, index + 1).join("/")}`)
        }

        // Get the newly created directory node
        currentNodeList = await getFiles(token, currentUrl, true)
        parentNode = findFilesNodeFromDataList(currentNodeList.data, pathName)
        if (parentNode === null) {
          throw new Error(`Failed to find newly created directory: ${pathArray.slice(0, index + 1).join("/")}`)
        }
        currentUrl = parentNode.relationships.files?.links.related.href ?? ""
        if (currentUrl === "") {
          throw new Error(`No files relationship found for node: ${pathArray.slice(0, index + 1).join("/")}`)
        }
        currentNodeList = await getFiles(token, currentUrl, true)
      }
    }

    if (parentNode === null) {
      throw new Error(`Failed to find parent directory: ${pathArray.join("/")}`)
    }
    const fileNode = findFilesNodeFromDataList(currentNodeList.data, fileName)
    if (fileNode !== null && update === false) {
      throw new Error(`File already exists and update is disabled: ${path}`)
    }

    const uploadUrl = fileNode?.links.upload ?? parentNode.links.upload
    if (uploadUrl === undefined) {
      throw new Error(`No upload link found for file: ${path}`)
    }

    const uploadUrlObj = new URL(uploadUrl)
    if (fileNode === null) {
      // Upload a new file
      uploadUrlObj.searchParams.set("name", fileName)
    }
    const uploadResponse = await fetchWithRetry(uploadUrlObj.toString(), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: content,
    })
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${path}`)
    }
  } catch (error) {
    throw new Error("Failed to write file", { cause: error })
  }
}

export const readDmpFile = async (token: string, projectId: string): Promise<{
  dmp: Dmp
  node: FilesNode
}> => {
  try {
    const { content, node } = await readFile(token, projectId, DMP_FILE_NAME)
    return {
      dmp: dmpSchema.parse(JSON.parse(content)),
      node,
    }
  } catch (error) {
    throw new Error("Failed to read DMP file", { cause: error })
  }
}

export const writeDmpFile = async (token: string, projectId: string, dmp: Dmp): Promise<void> => {
  try {
    await writeFile(token, projectId, DMP_FILE_NAME, JSON.stringify(dmp, null, 2))
  } catch (error) {
    throw new Error("Failed to write DMP file", { cause: error })
  }
}

export interface CreateProjectResponse {
  data: NodeData
}

export const createProjectResponseSchema = z.object({
  data: nodeDataSchema,
})

export const createProject = async (token: string, projectName: string): Promise<ProjectInfo> => {
  const url = `${GRDM_API_BASE_URL}/nodes/`
  const data = {
    data: {
      type: "nodes",
      attributes: {
        title: projectName,
        category: "project",
      },
    },
  }

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }
    const json = await response.json()
    const node = createProjectResponseSchema.parse(json).data

    return nodeToProjectInfo(node)
  } catch (error) {
    throw new Error("Failed to create project", { cause: error })
  }
}
