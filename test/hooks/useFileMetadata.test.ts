import type { GrdmFileMetadataResponse } from "@hirakinii-packages/grdm-api-typescript"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { useFileMetadata } from "../../src/hooks/useFileMetadata"

// Mock GrdmClient
const mockGetByProject = vi.fn()

vi.mock("@hirakinii-packages/grdm-api-typescript", () => ({
  GrdmClient: vi.fn().mockImplementation(() => ({
    fileMetadata: {
      getByProject: (...args: unknown[]) => mockGetByProject(...args),
    },
  })),
}))

// Mock Recoil token
vi.mock("recoil", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recoil")>()
  return {
    ...actual,
    useRecoilValue: () => "test-token",
  }
})

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockFileMetadataResponse: GrdmFileMetadataResponse = {
  data: {
    id: "project-123",
    type: "grdm-file-metadata",
    attributes: {
      editable: true,
      features: {},
      files: [
        {
          path: "osfstorage/data.csv",
          hash: null,
          folder: false,
          urlpath: "/project-123/files/osfstorage/data.csv",
          generated: false,
          items: [
            {
              schema: "grdm-file",
              active: true,
              "grdm-file:file-size": { value: 1024, extra: [] },
            },
          ],
        },
        {
          path: "osfstorage/report.pdf",
          hash: null,
          folder: false,
          urlpath: "/project-123/files/osfstorage/report.pdf",
          generated: false,
          items: [
            {
              schema: "grdm-file",
              active: true,
              "grdm-file:file-size": { value: "2048", extra: [] },
            },
          ],
        },
        {
          path: "osfstorage/no-size.txt",
          hash: null,
          folder: false,
          urlpath: "/project-123/files/osfstorage/no-size.txt",
          generated: false,
          items: [
            {
              schema: "grdm-file",
              active: true,
              // no file-size field
            },
          ],
        },
        {
          path: "osfstorage/subdir",
          hash: null,
          folder: true,
          urlpath: "/project-123/files/osfstorage/subdir",
          generated: false,
          items: [],
        },
      ],
    },
  },
}

describe("useFileMetadata", () => {
  beforeEach(() => {
    mockGetByProject.mockReset()
  })

  it("returns null when projectId is not provided", () => {
    const { result } = renderHook(() => useFileMetadata(null), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetByProject).not.toHaveBeenCalled()
  })

  it("fetches and returns a map of file paths to sizes", async () => {
    mockGetByProject.mockResolvedValueOnce(mockFileMetadataResponse)

    const { result } = renderHook(() => useFileMetadata("project-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetByProject).toHaveBeenCalledWith("project-123")
    const sizeMap = result.current.data
    expect(sizeMap).not.toBeNull()
    expect(sizeMap?.get("osfstorage/data.csv")).toBe(1024)
  })

  it("handles numeric string file sizes", async () => {
    mockGetByProject.mockResolvedValueOnce(mockFileMetadataResponse)

    const { result } = renderHook(() => useFileMetadata("project-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.get("osfstorage/report.pdf")).toBe(2048)
  })

  it("returns null size when file-size field is absent", async () => {
    mockGetByProject.mockResolvedValueOnce(mockFileMetadataResponse)

    const { result } = renderHook(() => useFileMetadata("project-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.get("osfstorage/no-size.txt")).toBeNull()
  })

  it("does not include folder entries in the size map", async () => {
    mockGetByProject.mockResolvedValueOnce(mockFileMetadataResponse)

    const { result } = renderHook(() => useFileMetadata("project-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.has("osfstorage/subdir")).toBe(false)
  })

  it("handles inactive metadata schemas by returning null", async () => {
    const responseWithInactive: GrdmFileMetadataResponse = {
      data: {
        id: "project-123",
        type: "grdm-file-metadata",
        attributes: {
          editable: true,
          features: {},
          files: [
            {
              path: "osfstorage/file.csv",
              hash: null,
              folder: false,
              urlpath: "/project-123/files/osfstorage/file.csv",
              generated: false,
              items: [
                {
                  schema: "grdm-file",
                  active: false, // inactive
                  "grdm-file:file-size": { value: 999, extra: [] },
                },
              ],
            },
          ],
        },
      },
    }
    mockGetByProject.mockResolvedValueOnce(responseWithInactive)

    const { result } = renderHook(() => useFileMetadata("project-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.get("osfstorage/file.csv")).toBeNull()
  })
})
