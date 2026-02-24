import { describe, it, expect } from "vitest"

import { initDmp } from "../src/dmp"
import type { User } from "../src/hooks/useUser"

const baseUser: User = {
  grdmId: "user123",
  fullName: "Taro Yamada",
  givenName: "Taro",
  familyName: "Yamada",
  givenNameJa: null,
  familyNameJa: null,
  orcid: null,
  researcherId: null,
  affiliation: "東京大学",
  timezone: "Asia/Tokyo",
  email: "taro@example.com",
  grdmProfileUrl: "https://example.com/profile",
  profileImage: "https://example.com/profile.jpg",
}

describe("initDmp", () => {
  it("uses English name when Japanese names are not available", () => {
    const dmp = initDmp(baseUser)

    expect(dmp.personInfo).toHaveLength(1)
    expect(dmp.personInfo[0].lastName).toBe("Yamada")
    expect(dmp.personInfo[0].firstName).toBe("Taro")
  })

  it("uses Japanese name when familyNameJa and givenNameJa are provided", () => {
    const userWithJaNames: User = {
      ...baseUser,
      givenNameJa: "太郎",
      familyNameJa: "山田",
    }

    const dmp = initDmp(userWithJaNames)

    expect(dmp.personInfo).toHaveLength(1)
    expect(dmp.personInfo[0].lastName).toBe("山田")
    expect(dmp.personInfo[0].firstName).toBe("太郎")
  })

  it("falls back to English name for each field independently", () => {
    const userWithPartialJaNames: User = {
      ...baseUser,
      givenNameJa: "太郎",
      familyNameJa: null, // no Japanese last name
    }

    const dmp = initDmp(userWithPartialJaNames)

    expect(dmp.personInfo[0].lastName).toBe("Yamada") // fallback to English
    expect(dmp.personInfo[0].firstName).toBe("太郎") // Japanese name used
  })

  it("returns empty personInfo when user is null", () => {
    const dmp = initDmp(null)

    expect(dmp.personInfo).toHaveLength(0)
  })

  it("initializes with correct metadata defaults", () => {
    const dmp = initDmp(null)

    expect(dmp.metadata.revisionType).toBe("新規")
    expect(dmp.metadata.submissionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dmp.linkedGrdmProjects).toEqual([])
    expect(dmp.dataInfo).toEqual([])
  })
})
