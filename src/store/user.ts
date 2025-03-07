import { selector } from "recoil"

import { getMe, GetMeResponse } from "@/grdmClient"
import { tokenAtom, authenticatedSelector } from "@/store/token"

export interface User {
  grdmId: string
  fullName: string
  givenName: string
  familyName: string
  orcid: string | null
  researcherId: string | null
  affiliation: string | null
  timezone: string
  email: string
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

export const userSelector = selector<User | null>({
  key: "dmp-editor.userSelector",
  get: ({ get }) => {
    const authenticated = get(authenticatedSelector)
    if (!authenticated) return null

    const token = get(tokenAtom)
    if (token === "") return null

    try {
      return getMe(token).then(toUser)
    } catch (error) {
      console.error("Failed to get user info from GRDM", error)
      return null
    }
  },
})
