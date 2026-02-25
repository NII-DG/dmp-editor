import { useEffect } from "react"
import { useBlocker } from "react-router-dom"

/**
 * Warns users about unsaved changes when navigating away.
 * - Registers a beforeunload handler for browser-level (tab close / reload) navigation.
 * - Uses React Router's useBlocker for SPA in-app navigation.
 *
 * @param isDirty - Whether the form has unsaved changes (e.g. formState.isDirty)
 * @returns The React Router Blocker object for handling SPA navigation confirmation
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  return useBlocker(isDirty)
}
