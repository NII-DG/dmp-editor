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
 * Returns true if the query contains Japanese characters
 * (hiragana, katakana, or CJK unified ideographs).
 */
function isJapaneseQuery(query: string): boolean {
  return /[\u3040-\u30FF\u4E00-\u9FFF\uF900-\uFAFF]/.test(query)
}

/**
 * Extracts the display name from a ROR organization's names array.
 * When preferredLang is specified, prefers a name matching that language.
 * Falls back to the name with type 'ror_display', then to the first entry.
 */
function extractDisplayName(names: RorApiOrganization["names"], preferredLang?: string): string {
  if (preferredLang) {
    const langMatch = names.find((n) => n.lang === preferredLang)
    if (langMatch) return langMatch.value
  }
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
    const preferredLang = isJapaneseQuery(query) ? "ja" : undefined

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const orgs = await rorClient.searchOrganizations(query)
        if (!cancelled) {
          setResults(orgs.map((org) => ({ id: org.id, name: extractDisplayName(org.names, preferredLang) })))
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
