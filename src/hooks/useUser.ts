import { useQuery } from "@tanstack/react-query"
import { useRecoilValue } from "recoil"

import { getMe, GetMeResponse } from "@/grdmClient"
import { tokenAtom } from "@/store/token"

export interface User {
  grdmId: string
  fullName: string
  givenName: string
  familyName: string
  orcid: string | null
  researcherId: string | null
  affiliation: string | null
  timezone: string
  email?: string | null
  grdmProfileUrl: string
  profileImage: string
}

export const toUser = (response: GetMeResponse): User => {
  const institutionJa = response.data.attributes.employment?.[0].institution_ja
  const departmentJa = response.data.attributes.employment?.[0].department_ja
  const affiliation = `${institutionJa ?? ""} ${departmentJa ?? ""}`.trim() ?? null

  return {
    grdmId: response.data.id,
    fullName: response.data.attributes.full_name,
    givenName: response.data.attributes.given_name,
    familyName: response.data.attributes.family_name,
    orcid: response.data.attributes.social.orcid ?? null,
    researcherId: response.data.attributes.social.researcherId ?? null,
    affiliation,
    timezone: response.data.attributes.timezone,
    email: response.data.attributes.email,
    grdmProfileUrl: response.data.links.html,
    profileImage: response.data.links.profile_image,
  }
}

/**
 * Custom hook to fetch current user.
 * AuthHelper guarantees that token is always available.
 */
export const useUser = () => {
  const token = useRecoilValue(tokenAtom)

  return useQuery<User | null, Error>({
    queryKey: ["user", token],
    queryFn: () => getMe(token).then(toUser),
    enabled: !!token,
  })
}
