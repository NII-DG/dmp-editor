import type { Project, ProjectsResponse } from "@hirakinii-packages/kaken-api-client-typescript"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { kakenProjectToDmpProjectInfo, useKakenProject } from "../../src/hooks/useKakenProject"

// Mock the KakenApiClient
const mockSearch = vi.fn()

vi.mock("@hirakinii-packages/kaken-api-client-typescript", () => ({
  KakenApiClient: vi.fn().mockImplementation(() => ({
    projects: { search: mockSearch },
    researchers: {},
    cache: {},
    [Symbol.asyncDispose]: vi.fn(),
  })),
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockProject: Project = {
  awardNumber: "23K12345",
  title: "テスト研究プロジェクト",
  allocations: [
    {
      name: "科学研究費助成事業",
      code: "JP",
    },
  ],
  periodOfAward: {
    startFiscalYear: 2023,
    endFiscalYear: 2026,
  },
}

describe("kakenProjectToDmpProjectInfo", () => {
  it("maps all fields correctly from a full KAKEN project", () => {
    const result = kakenProjectToDmpProjectInfo(mockProject)

    expect(result.fundingAgency).toBe("科学研究費助成事業")
    expect(result.programName).toBe("科学研究費助成事業")
    expect(result.programCode).toBe("JP")
    expect(result.projectCode).toBe("23K12345")
    expect(result.projectName).toBe("テスト研究プロジェクト")
    expect(result.adoptionYear).toBe("2023")
    expect(result.startYear).toBe("2023")
    expect(result.endYear).toBe("2026")
  })

  it("handles missing allocations gracefully", () => {
    const project: Project = { ...mockProject, allocations: [] }
    const result = kakenProjectToDmpProjectInfo(project)

    expect(result.fundingAgency).toBe("")
    expect(result.programName).toBe("")
    expect(result.programCode).toBe("")
  })

  it("handles undefined allocations", () => {
    const project: Project = { ...mockProject, allocations: undefined }
    const result = kakenProjectToDmpProjectInfo(project)

    expect(result.fundingAgency).toBe("")
    expect(result.programName).toBe("")
    expect(result.programCode).toBe("")
  })

  it("handles missing periodOfAward", () => {
    const project: Project = { ...mockProject, periodOfAward: undefined }
    const result = kakenProjectToDmpProjectInfo(project)

    expect(result.adoptionYear).toBe("")
    expect(result.startYear).toBe("")
    expect(result.endYear).toBe("")
  })

  it("handles missing awardNumber", () => {
    const project: Project = { ...mockProject, awardNumber: undefined }
    const result = kakenProjectToDmpProjectInfo(project)

    expect(result.projectCode).toBe("")
  })

  it("handles missing title", () => {
    const project: Project = { ...mockProject, title: undefined }
    const result = kakenProjectToDmpProjectInfo(project)

    expect(result.projectName).toBe("")
  })
})

describe("useKakenProject", () => {
  beforeEach(() => {
    mockSearch.mockReset()
  })

  it("does not fetch on initial render (enabled: false)", () => {
    const { result } = renderHook(() => useKakenProject("23K12345"), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it("fetches and maps data when refetch is called", async () => {
    const mockResponse: ProjectsResponse = {
      rawData: {},
      projects: [mockProject],
      totalResults: 1,
    }
    mockSearch.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useKakenProject("23K12345"), { wrapper: createWrapper() })

    const queryResult = await result.current.refetch()

    expect(queryResult.isSuccess).toBe(true)
    expect(mockSearch).toHaveBeenCalledWith({ projectNumber: "23K12345" })
    expect(queryResult.data?.projectCode).toBe("23K12345")
    expect(queryResult.data?.projectName).toBe("テスト研究プロジェクト")
    expect(queryResult.data?.fundingAgency).toBe("科学研究費助成事業")
  })

  it("returns null when no projects found", async () => {
    const mockResponse: ProjectsResponse = {
      rawData: {},
      projects: [],
      totalResults: 0,
    }
    mockSearch.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useKakenProject("99Z99999"), { wrapper: createWrapper() })

    const queryResult = await result.current.refetch()

    expect(queryResult.isSuccess).toBe(true)
    expect(queryResult.data).toBeNull()
  })
})
