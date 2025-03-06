import { atom, selector } from "recoil"

import { Dmp, initDmp } from "@/dmp"

// === DMP ===

export const dmpAtom = atom<Dmp>({
  key: "dmp-editor.dmp",
  default: initDmp(),
})

// === Project Name ===

export const projectNameAtom = atom<string>({
  key: "dmp-editor.projectName",
  default: "",
})

// === Form Validation ===

export interface FormValidationState {
  projectName: boolean
}

export const initFormValidationState = (): FormValidationState => ({
  projectName: true,
})

export const isFormValid = (formState: FormValidationState): boolean => {
  return Object.values(formState).every(value => value)
}

export const formValidationStateAtom = atom<FormValidationState>({
  key: "dmp-editor.formValidationState",
  default: initFormValidationState(),
})

export const formValidSelector = selector<boolean>({
  key: "dmp-editor.formValidSelector",
  get: ({ get }) => isFormValid(get(formValidationStateAtom)),
})
