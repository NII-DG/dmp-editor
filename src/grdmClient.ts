import { z } from "zod"

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 5,
  timeout = 10000, // 10 seconds
): Promise<Response> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      if (response.status === 429) {
        if (attempt < retries) {
          console.warn("Too many requests (429) - Retrying in 1s")
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        } else {
          throw new Error("Too many requests (429) - Max retries exceeded")
        }
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (attempt < retries) {
        console.warn("Failed to fetch - Retrying in 1s", error)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      } else {
        throw error
      }
    }
  }

  throw new Error("Unreachable code reached")
}

export const authenticateGrdm = async (token: string): Promise<boolean> => {
  const url = "https://api.rdm.nii.ac.jp/v2/users/me/"

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    const json = await response.json()
    console.log(JSON.stringify(json, null, 2))

    return response.ok
  } catch (error) {
    console.error("Failed to authenticate with GRDM", error)
    return false
  }
}

export interface GetMeResponse {
  data: {
    id: string
    attributes: {
      full_name: string
      timezone: string
      email: string
    }
    links: {
      profile_image: string
      self: string
    }
  }
}

export const getMeResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      full_name: z.string(),
      timezone: z.string(),
      email: z.string(),
    }),
    links: z.object({
      profile_image: z.string(),
      self: z.string(),
    }),
  }),
})

export const getMe = async (token: string): Promise<GetMeResponse> => {
  const url = "https://api.rdm.nii.ac.jp/v2/users/me/"

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    const json = await response.json()

    return getMeResponseSchema.parse(json)
  } catch (error) {
    console.error("Failed to get user info from GRDM", error)
    throw error
  }
}

