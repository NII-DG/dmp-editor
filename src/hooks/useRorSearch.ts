import { useEffect, useState } from "react"

export interface RorOrganization {
  /** ROR identifier URL, e.g. "https://ror.org/02mhbdp94" */
  id: string
  /** Organization display name */
  name: string
}

interface RorApiItem {
  id: string
  name: string
}

interface RorApiResponse {
  number_of_results: number
  items: RorApiItem[]
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

/**
 * Custom hook for searching ROR (Research Organization Registry) organizations.
 * Debounces requests by 300ms to avoid excessive API calls.
 * Routes requests through the /ror-api local proxy to avoid CORS issues.
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
        const response = await fetch(`/ror-api?query=${encodeURIComponent(query)}`)
        if (!response.ok) {
          throw new Error(`ROR API responded with status ${response.status}`)
        }
        const data: RorApiResponse = await response.json()
        if (!cancelled) {
          setResults(data.items.map(({ id, name }) => ({ id, name })))
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
