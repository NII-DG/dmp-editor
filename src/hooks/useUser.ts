import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { getMe } from "@/grdmClient"
import { tokenAtom } from "@/store/token"
import { toUser, User } from "@/store/user"

/**
 * Custom hook to fetch current user.
 * AuthHelper guarantees that token is always available.
 */
export const useUser = () => {
  const token = useRecoilValue(tokenAtom)
  return useQuery<User | null, Error>({
    queryKey: ["user", token],
    queryFn: () => (token ? getMe(token).then(toUser) : Promise.resolve(null)),
    enabled: true,
    staleTime: Infinity,
    refetchOnMount: "always",
  })
}
