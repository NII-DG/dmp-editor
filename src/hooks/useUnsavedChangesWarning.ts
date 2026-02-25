import { useEffect } from "react"
import { useBlocker } from "react-router-dom"

/**
 * Warns users about unsaved changes when navigating away.
 * - Registers a beforeunload handler for browser-level (tab close / reload) navigation.
 * - Uses React Router's useBlocker for SPA in-app navigation.
 *
 * @param isDirty - Whether the form has unsaved changes (used for beforeunload and UI subscriptions)
 * @param shouldBlockFn - Optional stable function that reads the live dirty state at navigation
 *   time. Pass a ref-based function (e.g. `useRef(() => methods.formState.isDirty).current`)
 *   to avoid false blocks caused by React's effect ordering: useBlocker registers its blocker in
 *   a useEffect, which in parent components fires AFTER children's effects. A child that calls
 *   navigate() after reset() would be blocked by the still-registered old blocker unless the
 *   blocker reads directly from the live store via a stable function.
 * @returns The React Router Blocker object for handling SPA navigation confirmation
 */
export function useUnsavedChangesWarning(isDirty: boolean, shouldBlockFn?: () => boolean) {
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  return useBlocker(shouldBlockFn ?? isDirty)
}
