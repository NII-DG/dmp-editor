import { useQuery } from "@tanstack/react-query"

import { authenticateGrdm } from "@/grdmClient"

/**
 * Custom hook to authenticate GRDM.
 * Accepts token parameter; AuthHelper ensures token is provided.
 */
export const useAuth = (token: string) => {
  return useQuery<boolean, Error>({
    queryKey: ["auth", token],
    queryFn: () => authenticateGrdm(token),
    enabled: token !== "",
    staleTime: Infinity,
    refetchOnMount: "always",
  })
}
