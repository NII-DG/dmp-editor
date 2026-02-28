import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { useUnsavedChangesWarning } from "../../src/hooks/useUnsavedChangesWarning"

const mockUseBlocker = vi.fn()

vi.mock("react-router-dom", () => ({
  useBlocker: (...args: unknown[]) => mockUseBlocker(...args),
}))

describe("useUnsavedChangesWarning", () => {
  beforeEach(() => {
    mockUseBlocker.mockReturnValue({ state: "unblocked" })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("beforeunload event", () => {
    it("does not register beforeunload handler when isDirty is false", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")
      renderHook(() => useUnsavedChangesWarning(false))
      expect(addEventListenerSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function))
    })

    it("registers beforeunload handler when isDirty is true", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")
      renderHook(() => useUnsavedChangesWarning(true))
      expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    })

    it("calls preventDefault on beforeunload event when isDirty is true", () => {
      renderHook(() => useUnsavedChangesWarning(true))

      const event = new Event("beforeunload")
      const preventDefaultSpy = vi.spyOn(event, "preventDefault")
      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it("does not call preventDefault on beforeunload event when isDirty is false", () => {
      renderHook(() => useUnsavedChangesWarning(false))

      const event = new Event("beforeunload")
      const preventDefaultSpy = vi.spyOn(event, "preventDefault")
      window.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it("removes beforeunload handler on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")
      const { unmount } = renderHook(() => useUnsavedChangesWarning(true))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    })

    it("removes beforeunload handler when isDirty changes from true to false", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")
      const { rerender } = renderHook(({ isDirty }) => useUnsavedChangesWarning(isDirty), {
        initialProps: { isDirty: true },
      })

      rerender({ isDirty: false })

      expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    })
  })

  describe("useBlocker integration", () => {
    it("calls useBlocker with false when isDirty is false", () => {
      renderHook(() => useUnsavedChangesWarning(false))
      expect(mockUseBlocker).toHaveBeenCalledWith(false)
    })

    it("calls useBlocker with true when isDirty is true", () => {
      renderHook(() => useUnsavedChangesWarning(true))
      expect(mockUseBlocker).toHaveBeenCalledWith(true)
    })

    it("returns the blocker object from useBlocker", () => {
      const mockBlocker = {
        state: "blocked" as const,
        proceed: vi.fn(),
        reset: vi.fn(),
        location: {} as Location,
      }
      mockUseBlocker.mockReturnValue(mockBlocker)

      const { result } = renderHook(() => useUnsavedChangesWarning(true))

      expect(result.current).toBe(mockBlocker)
    })

    it("returns unblocked blocker when isDirty is false", () => {
      const unblockedBlocker = { state: "unblocked" as const, proceed: undefined, reset: undefined, location: undefined }
      mockUseBlocker.mockReturnValue(unblockedBlocker)

      const { result } = renderHook(() => useUnsavedChangesWarning(false))

      expect(result.current.state).toBe("unblocked")
    })
  })
})
