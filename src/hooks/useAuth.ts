import { useQuery } from "@tanstack/react-query"

import { authenticateGrdm } from "@/grdmClient"

export const useAuth = (token: string) => {
  return useQuery<boolean, Error>({
    queryKey: ["auth", token],
    queryFn: () => authenticateGrdm(token),
    enabled: token !== "",
    staleTime: Infinity,
    refetchOnMount: "always",
  })
}
