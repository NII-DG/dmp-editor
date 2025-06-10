import { atom } from "recoil"

import { localStorageEffect } from "@/store/effect"

export const tokenAtom = atom<string>({
  key: "dmp-editor.token",
  default: "",
  effects: [localStorageEffect("dmp-editor.token")],
})
