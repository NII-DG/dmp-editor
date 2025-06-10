import { atom } from "recoil"

import { Dmp, initDmp } from "@/dmp"
import type { ProjectInfo as GrdmProjectInfo } from "@/grdmClient"

// === DMP state ===
export const dmpAtom = atom<Dmp>({
  key: "dmp-editor.dmp",
  default: initDmp(),
})

// === GRDM Project Name ===
export const grdmProjectNameAtom = atom<string>({
  key: "dmp-editor.grdmProjectName",
  default: "",
})

// === Existing Projects ===
export const existingGrdmProjectNamesAtom = atom<string[]>({
  key: "dmp-editor.existingGrdmProjectNames",
  default: [] as string[],
})

export const existingGrdmProjectsAtom = atom<GrdmProjectInfo[]>({
  key: "dmp-editor.existingGrdmProjects",
  default: [] as GrdmProjectInfo[],
})

// === new/edit flag ===
export const isNewAtom = atom<boolean>({
  key: "dmp-editor.isNew",
  default: false,
})
