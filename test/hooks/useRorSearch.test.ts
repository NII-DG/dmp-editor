import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { useRorSearch } from "../../src/hooks/useRorSearch"

const mockSearchOrganizations = vi.hoisted(() => vi.fn())

vi.mock("@hirakinii-packages/ror-api-typescript", () => ({
  RorClient: vi.fn().mockImplementation(() => ({
    searchOrganizations: mockSearchOrganizations,
  })),
}))

// Minimal ROR organization objects with the fields used by the hook
const mockRorOrgs = [
  {
    id: "https://ror.org/02mhbdp94",
    names: [{ value: "University of Tokyo", types: ["ror_display"] }],
  },
  {
    id: "https://ror.org/01t18xk63",
    names: [{ value: "Kyoto University", types: ["ror_display"] }],
  },
]

describe("useRorSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSearchOrganizations.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns empty results and is not loading when query is empty", () => {
    const { result } = renderHook(() => useRorSearch(""))
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockSearchOrganizations).not.toHaveBeenCalled()
  })

  it("does not fetch when query is shorter than 2 characters", () => {
    renderHook(() => useRorSearch("T"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockSearchOrganizations).not.toHaveBeenCalled()
  })

  it("does not fetch before 300ms debounce period", () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    renderHook(() => useRorSearch("Tokyo"))
    act(() => { vi.advanceTimersByTime(299) })
    expect(mockSearchOrganizations).not.toHaveBeenCalled()
  })

  it("calls searchOrganizations after 300ms debounce", () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    renderHook(() => useRorSearch("Tokyo"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockSearchOrganizations).toHaveBeenCalledOnce()
    expect(mockSearchOrganizations).toHaveBeenCalledWith("Tokyo")
  })

  it("passes the query as-is including Japanese characters", () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    renderHook(() => useRorSearch("東京大学"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockSearchOrganizations).toHaveBeenCalledWith("東京大学")
  })

  it("returns mapped organization results after debounce", async () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    const { result } = renderHook(() => useRorSearch("Tokyo"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results).toHaveLength(2)
    expect(result.current.results[0]).toEqual({
      id: "https://ror.org/02mhbdp94",
      name: "University of Tokyo",
    })
    expect(result.current.results[1]).toEqual({
      id: "https://ror.org/01t18xk63",
      name: "Kyoto University",
    })
    expect(result.current.isLoading).toBe(false)
  })

  it("prefers ror_display name over other name types", async () => {
    mockSearchOrganizations.mockResolvedValue([{
      id: "https://ror.org/01ggx4157",
      names: [
        { value: "CERN Acronym", types: ["acronym"] },
        { value: "European Organization for Nuclear Research", types: ["ror_display"] },
        { value: "CERN Label", types: ["label"] },
      ],
    }])
    const { result } = renderHook(() => useRorSearch("CERN"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results[0].name).toBe("European Organization for Nuclear Research")
  })

  it("prefers Japanese name (lang: 'ja') over ror_display for Japanese query", async () => {
    mockSearchOrganizations.mockResolvedValue([{
      id: "https://ror.org/02mhbdp94",
      names: [
        { value: "The University of Tokyo", types: ["ror_display"], lang: null },
        { value: "東京大学", types: ["label"], lang: "ja" },
      ],
    }])
    const { result } = renderHook(() => useRorSearch("東京大学"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results[0].name).toBe("東京大学")
  })

  it("falls back to ror_display when no Japanese name exists for Japanese query", async () => {
    mockSearchOrganizations.mockResolvedValue([{
      id: "https://ror.org/01ggx4157",
      names: [
        { value: "CERN", types: ["acronym"], lang: null },
        { value: "European Organization for Nuclear Research", types: ["ror_display"], lang: null },
      ],
    }])
    const { result } = renderHook(() => useRorSearch("欧州原子核研究機構"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results[0].name).toBe("European Organization for Nuclear Research")
  })

  it("uses ror_display for non-Japanese query even when Japanese name exists", async () => {
    mockSearchOrganizations.mockResolvedValue([{
      id: "https://ror.org/02mhbdp94",
      names: [
        { value: "The University of Tokyo", types: ["ror_display"], lang: null },
        { value: "東京大学", types: ["label"], lang: "ja" },
      ],
    }])
    const { result } = renderHook(() => useRorSearch("Tokyo"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results[0].name).toBe("The University of Tokyo")
  })

  it("falls back to first name when ror_display is absent", async () => {
    mockSearchOrganizations.mockResolvedValue([{
      id: "https://ror.org/01ggx4157",
      names: [
        { value: "First Name", types: ["label"] },
        { value: "Second Name", types: ["alias"] },
      ],
    }])
    const { result } = renderHook(() => useRorSearch("test"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results[0].name).toBe("First Name")
  })

  it("returns empty results on API error", async () => {
    mockSearchOrganizations.mockRejectedValue(new Error("API error"))
    const { result } = renderHook(() => useRorSearch("Tokyo"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.results).toEqual([])
  })

  it("cancels previous debounce when query changes before it fires", () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    const { rerender } = renderHook(({ q }) => useRorSearch(q), {
      initialProps: { q: "Tokyo" },
    })
    // Advance 200ms (Tokyo timer not yet fired)
    act(() => { vi.advanceTimersByTime(200) })
    // Change query - cancels Tokyo timer, starts Kyoto timer
    rerender({ q: "Kyoto" })
    // Advance 200ms more (200ms since Kyoto started - still within debounce)
    act(() => { vi.advanceTimersByTime(200) })
    expect(mockSearchOrganizations).not.toHaveBeenCalled()
    // Advance 100ms more (300ms since Kyoto - debounce fires)
    act(() => { vi.advanceTimersByTime(100) })
    expect(mockSearchOrganizations).toHaveBeenCalledOnce()
    expect(mockSearchOrganizations).toHaveBeenCalledWith("Kyoto")
  })

  it("clears results when query becomes empty", async () => {
    mockSearchOrganizations.mockResolvedValue(mockRorOrgs)
    const { result, rerender } = renderHook(({ q }) => useRorSearch(q), {
      initialProps: { q: "Tokyo" },
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.results).toHaveLength(2)
    // Clear the query
    rerender({ q: "" })
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })
})
