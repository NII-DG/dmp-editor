import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { useRorSearch } from "../../src/hooks/useRorSearch"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

const mockRorResponse = {
  number_of_results: 2,
  items: [
    { id: "https://ror.org/02mhbdp94", name: "University of Tokyo" },
    { id: "https://ror.org/01t18xk63", name: "Kyoto University" },
  ],
}

describe("useRorSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns empty results and is not loading when query is empty", () => {
    const { result } = renderHook(() => useRorSearch(""))
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does not fetch when query is shorter than 2 characters", () => {
    renderHook(() => useRorSearch("T"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does not fetch before 300ms debounce period", () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
    renderHook(() => useRorSearch("Tokyo"))
    act(() => { vi.advanceTimersByTime(299) })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("fetches from ROR proxy endpoint after 300ms debounce", () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
    renderHook(() => useRorSearch("Tokyo"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith("/ror-api?query=Tokyo")
  })

  it("encodes special characters in the query", () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
    renderHook(() => useRorSearch("東京大学"))
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockFetch).toHaveBeenCalledWith(
      "/ror-api?query=%E6%9D%B1%E4%BA%AC%E5%A4%A7%E5%AD%A6",
    )
  })

  it("returns mapped organization results after debounce", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
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

  it("returns empty results on API error response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const { result } = renderHook(() => useRorSearch("Tokyo"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.results).toEqual([])
  })

  it("returns empty results on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useRorSearch("Tokyo"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.results).toEqual([])
  })

  it("cancels previous debounce when query changes before it fires", () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
    const { rerender } = renderHook(({ q }) => useRorSearch(q), {
      initialProps: { q: "Tokyo" },
    })
    // Advance 200ms (Tokyo timer not yet fired)
    act(() => { vi.advanceTimersByTime(200) })
    // Change query - cancels Tokyo timer, starts Kyoto timer
    rerender({ q: "Kyoto" })
    // Advance 200ms more (200ms since Kyoto started - still within debounce)
    act(() => { vi.advanceTimersByTime(200) })
    expect(mockFetch).not.toHaveBeenCalled()
    // Advance 100ms more (300ms since Kyoto - debounce fires)
    act(() => { vi.advanceTimersByTime(100) })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith("/ror-api?query=Kyoto")
  })

  it("clears results when query becomes empty", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockRorResponse })
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
