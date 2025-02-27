import { atom, selector } from "recoil"

import { authenticateGrdm } from "@/grdmClient"
import { localStorageEffect } from "@/store/effect"

export const tokenAtom = atom<string>({
  key: "dmp-editor.token",
  default: "",
  effects: [localStorageEffect("dmp-editor.token")],
})

// for caching the authentication status
export const authenticatedAtom = atom<boolean | null>({
  key: "dmp-editor.authenticated",
  default: null,
})

export const authenticatedSelector = selector<boolean>({
  key: "dmp-editor.authenticatedSelector",
  get: async ({ get }) => {
    const cachedAuth = get(authenticatedAtom)
    if (cachedAuth !== null) return cachedAuth

    const token = get(tokenAtom)
    if (token === "") return false

    try {
      return authenticateGrdm(token)
    } catch (error) {
      console.error("Failed to authenticate with GRDM", error)
      return false
    }
  },
  set: ({ set }, newValue) => {
    set(authenticatedAtom, newValue)
  },
})
