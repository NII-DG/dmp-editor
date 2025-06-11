import { useQuery } from "@tanstack/react-query"

import { authenticateGrdm } from "@/grdmClient"

/**
 * Custom hook to authenticate GRDM.
 * @param token - authentication token
 */
export const useAuth = (token: string) => {
  return useQuery<boolean, Error>({
    queryKey: ["auth", token],
    queryFn: () => authenticateGrdm(token),
    enabled: !!token,
  })
}
