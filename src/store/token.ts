import { atom, selector } from "recoil"

import { authenticateGrdm } from "@/grdmClient"
import { localStorageEffect } from "@/store/effect"

export const tokenAtom = atom<string>({
  key: "dmp-editor.token",
  default: "",
  effects: [localStorageEffect("dmp-editor.token")],
})

export const authSelector = selector<boolean>({
  key: "dmp-editor.authSelector",
  get: async ({ get }) => {
    const token = get(tokenAtom)
    if (token === "") return false

    try {
      return authenticateGrdm(token)
    } catch (error) {
      console.error("Failed to authenticate with GRDM", error)
      return false
    }
  },
})
