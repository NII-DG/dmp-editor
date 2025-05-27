import { useQuery } from "@tanstack/react-query"

import { getMe } from "@/grdmClient"
import { toUser, User } from "@/store/user"

export const useUser = (token: string) =>
  useQuery<User | null, Error>({
    queryKey: ["user", token],
    queryFn: () => (token ? getMe(token).then(toUser) : null),
    enabled: token !== "",
    staleTime: Infinity,
    refetchOnMount: "always",
  })
