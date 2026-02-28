import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import type { GetMeResponse } from "../../src/grdmClient"
import { toUser, useUser } from "../../src/hooks/useUser"

// Unmock useUser to test actual implementation (overrides setupTests.ts global mock)
vi.unmock("@/hooks/useUser")

// Mock getMe
const mockGetMe = vi.fn()
vi.mock("@/grdmClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/grdmClient")>()
  return {
    ...actual,
    getMe: (...args: unknown[]) => mockGetMe(...args),
  }
})

// Mock Recoil token
vi.mock("recoil", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recoil")>()
  return {
    ...actual,
    useRecoilValue: () => "test-token",
  }
})

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const baseMeResponse: GetMeResponse = {
  data: {
    id: "user123",
    attributes: {
      full_name: "Taro Yamada",
      given_name: "Taro",
      family_name: "Yamada",
      social: { orcid: "0000-0001-2345-6789", researcherId: "A-1234" },
      employment: [
        { institution_ja: "東京大学", department_ja: "工学部" },
      ],
      timezone: "Asia/Tokyo",
      email: "taro@example.com",
    },
    links: {
      html: "https://example.com/profile/user123",
      profile_image: "https://example.com/profile/user123.jpg",
    },
  },
}

describe("toUser", () => {
  it("maps basic fields correctly", () => {
    const user = toUser(baseMeResponse)

    expect(user.grdmId).toBe("user123")
    expect(user.fullName).toBe("Taro Yamada")
    expect(user.givenName).toBe("Taro")
    expect(user.familyName).toBe("Yamada")
    expect(user.orcid).toBe("0000-0001-2345-6789")
    expect(user.researcherId).toBe("A-1234")
    expect(user.affiliation).toBe("東京大学 工学部")
    expect(user.timezone).toBe("Asia/Tokyo")
    expect(user.email).toBe("taro@example.com")
  })

  it("maps givenNameJa and familyNameJa when provided", () => {
    const response: GetMeResponse = {
      data: {
        ...baseMeResponse.data,
        attributes: {
          ...baseMeResponse.data.attributes,
          given_name_ja: "太郎",
          family_name_ja: "山田",
        },
      },
    }

    const user = toUser(response)

    expect(user.givenNameJa).toBe("太郎")
    expect(user.familyNameJa).toBe("山田")
  })

  it("returns null for givenNameJa and familyNameJa when not provided", () => {
    const user = toUser(baseMeResponse)

    expect(user.givenNameJa).toBeNull()
    expect(user.familyNameJa).toBeNull()
  })

  it("returns null for givenNameJa and familyNameJa when explicitly null", () => {
    const response: GetMeResponse = {
      data: {
        ...baseMeResponse.data,
        attributes: {
          ...baseMeResponse.data.attributes,
          given_name_ja: null,
          family_name_ja: null,
        },
      },
    }

    const user = toUser(response)

    expect(user.givenNameJa).toBeNull()
    expect(user.familyNameJa).toBeNull()
  })
})

describe("useUser", () => {
  beforeEach(() => {
    mockGetMe.mockReset()
  })

  it("returns user data with Japanese names when available", async () => {
    const responseWithJaNames: GetMeResponse = {
      data: {
        ...baseMeResponse.data,
        attributes: {
          ...baseMeResponse.data.attributes,
          given_name_ja: "太郎",
          family_name_ja: "山田",
        },
      },
    }
    mockGetMe.mockResolvedValueOnce(responseWithJaNames)

    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.givenNameJa).toBe("太郎")
    expect(result.current.data?.familyNameJa).toBe("山田")
  })
})
