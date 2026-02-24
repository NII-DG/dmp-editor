import type { RorOrganization as RorApiOrganization } from "@hirakinii-packages/ror-api-typescript"
import { RorClient } from "@hirakinii-packages/ror-api-typescript"
import { useEffect, useState } from "react"

export interface RorOrganization {
  /** ROR identifier URL, e.g. "https://ror.org/02mhbdp94" */
  id: string
  /** Organization display name */
  name: string
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

const rorClient = new RorClient({ clientId: "dmp-editor" })

/**
 * Extracts the display name from a ROR organization's names array.
 * Prefers the name with type 'ror_display'; falls back to the first entry.
 */
function extractDisplayName(names: RorApiOrganization["names"]): string {
  const displayName = names.find((n) => n.types.includes("ror_display"))
  return (displayName ?? names[0])?.value ?? ""
}

/**
 * Custom hook for searching ROR (Research Organization Registry) organizations.
 * Uses the @hirakinii-packages/ror-api-typescript client with 300ms debounce.
 * @param query - Search query string (minimum 2 characters to trigger a search)
 * @returns Object with results array and isLoading boolean
 */
export function useRorSearch(query: string): { results: RorOrganization[]; isLoading: boolean } {
  const [results, setResults] = useState<RorOrganization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const orgs = await rorClient.searchOrganizations(query)
        if (!cancelled) {
          setResults(orgs.map((org) => ({ id: org.id, name: extractDisplayName(org.names) })))
        }
      } catch (error) {
        if (!cancelled) {
          console.error("ROR organization search failed:", error)
          setResults([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return { results, isLoading }
}
