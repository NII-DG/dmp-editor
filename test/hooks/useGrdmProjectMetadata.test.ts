import type { GrdmProjectMetadataAttributes, GrdmRegisteredMeta } from "@hirakinii-packages/grdm-api-typescript"
import type { TransformedList, TransformedResource } from "osf-api-v2-typescript"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { useGrdmProjectMetadata } from "../../src/hooks/useGrdmProjectMetadata"

// Mock GrdmClient
const mockListByNode = vi.fn()

vi.mock("@hirakinii-packages/grdm-api-typescript", () => ({
  GrdmClient: vi.fn().mockImplementation(() => ({
    projectMetadata: {
      listByNode: (...args: unknown[]) => mockListByNode(...args),
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

const mockGrdmMeta: GrdmRegisteredMeta = {
  funder: "日本学術振興会",
  programNameJa: "科学研究費助成事業",
  programNameEn: "Grants-in-Aid for Scientific Research",
  projectNameJa: "テストプロジェクト",
  projectNameEn: "Test Project",
  japanGrantNumber: "21K00000",
  fundingStreamCode: "KA",
}

const mockRegistration: TransformedResource<GrdmProjectMetadataAttributes> = {
  id: "reg-001",
  type: "registrations",
  title: "Test Registration",
  description: "",
  category: "project",
  date_created: "2024-01-01T00:00:00Z",
  date_modified: "2024-06-01T00:00:00Z",
  public: true,
  tags: [],
  grdmMeta: mockGrdmMeta,
} as unknown as TransformedResource<GrdmProjectMetadataAttributes>

const mockListResponse: TransformedList<GrdmProjectMetadataAttributes> = {
  data: [mockRegistration],
  meta: { total: 1 },
}

describe("useGrdmProjectMetadata", () => {
  beforeEach(() => {
    mockListByNode.mockReset()
  })

  it("does not fetch when nodeId is not provided", () => {
    const { result } = renderHook(() => useGrdmProjectMetadata(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
    expect(mockListByNode).not.toHaveBeenCalled()
  })

  it("does not fetch when token is empty", () => {
    // token is "test-token" in mock, so this test relies on nodeId being null
    const { result } = renderHook(() => useGrdmProjectMetadata(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
    expect(mockListByNode).not.toHaveBeenCalled()
  })

  it("fetches project metadata and returns the list", async () => {
    mockListByNode.mockResolvedValueOnce(mockListResponse)

    const { result } = renderHook(() => useGrdmProjectMetadata("node-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockListByNode).toHaveBeenCalledWith("node-123")
    expect(result.current.data).toEqual(mockListResponse)
  })

  it("exposes grdmMeta fields from the first registration", async () => {
    mockListByNode.mockResolvedValueOnce(mockListResponse)

    const { result } = renderHook(() => useGrdmProjectMetadata("node-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const firstReg = result.current.data?.data[0]
    expect(firstReg?.grdmMeta?.funder).toBe("日本学術振興会")
    expect(firstReg?.grdmMeta?.japanGrantNumber).toBe("21K00000")
    expect(firstReg?.grdmMeta?.programNameJa).toBe("科学研究費助成事業")
  })

  it("transitions to error state when GrdmClient throws", async () => {
    mockListByNode.mockRejectedValueOnce(new Error("API Error"))

    const { result } = renderHook(() => useGrdmProjectMetadata("node-error"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe("API Error")
  })

  it("returns an empty list when no registrations exist for the node", async () => {
    const emptyResponse: TransformedList<GrdmProjectMetadataAttributes> = {
      data: [],
      meta: { total: 0 },
    }
    mockListByNode.mockResolvedValueOnce(emptyResponse)

    const { result } = renderHook(() => useGrdmProjectMetadata("node-empty"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(0)
  })
})
