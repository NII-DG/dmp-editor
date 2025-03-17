import { atom, selector } from "recoil"

import { Dmp, DmpMetadata, dmpMetadataKeys, initDmp, ProjectInfo, projectInfoKeys } from "@/dmp"

// === DMP ===

export const dmpAtom = atom<Dmp>({
  key: "dmp-editor.dmp",
  default: initDmp(),
})

// === Project Name ===

export const grdmProjectNameAtom = atom<string>({
  key: "dmp-editor.grdmProjectName",
  default: "",
})

export const existingGrdmProjectNamesAtom = atom<string[]>({
  key: "dmp-editor.existingGrdmProjectNames",
  default: [] as string[],
})

// === Form Validation ===

type FormErrorsKeys = "grdmProjectName" | keyof DmpMetadata | keyof ProjectInfo
const formErrorsKeys: FormErrorsKeys[] = ["grdmProjectName", ...dmpMetadataKeys, ...projectInfoKeys]
export type FormErrors = Record<FormErrorsKeys, string | null>
export type FormTouched = Record<FormErrorsKeys, boolean>

export const initFormErrorsState = (): FormErrors => {
  return (formErrorsKeys).reduce((acc, key) => {
    acc[key] = null
    return acc
  }, {} as FormErrors)
}

export const initFormTouchedState = (state = false): FormTouched => {
  return (formErrorsKeys).reduce((acc, key) => {
    acc[key] = state
    return acc
  }, {} as FormTouched)
}

export type FormValues = DmpMetadata[keyof DmpMetadata] | ProjectInfo[keyof ProjectInfo] | string

export const validateGrdmProjectName = (value: string | null | undefined, existingProjectNames: string[]): string | null => {
  if (existingProjectNames.includes(value ?? "")) return "同じ名前の GRDM プロジェクトが既に存在します。"
  if (!value) return "プロジェクト名を入力してください"
  return null
}

const projectInfoRequiredKeys: (keyof ProjectInfo)[] = ["fundingAgency", "projectCode", "projectName"]

export const validate = (key: FormErrorsKeys, value: FormValues): string | null => {
  if (dmpMetadataKeys.includes(key as keyof DmpMetadata)) {
    if (!value) return "必須項目です"
  }
  if (projectInfoKeys.includes(key as keyof ProjectInfo)) {
    if (projectInfoRequiredKeys.includes(key as keyof ProjectInfo) && !value) {
      return "必須項目です"
    }
  }
  return null
}

export const formTouchedStateAtom = atom<FormTouched>({
  key: "dmp-editor.formTouchedState",
  default: initFormTouchedState(),
})

export const formValidationState = selector<FormErrors>({
  key: "dmp-editor.formValidationState",
  get: ({ get }) => {
    const dmp = get(dmpAtom)
    const touched = get(formTouchedStateAtom)
    const errors: FormErrors = initFormErrorsState()
    for (const key of formErrorsKeys) {
      if (!touched[key]) continue
      let error: string | null = null
      if (key === "grdmProjectName") {
        error = validateGrdmProjectName(get(grdmProjectNameAtom), get(existingGrdmProjectNamesAtom))
      } else if (dmpMetadataKeys.includes(key as keyof DmpMetadata)) {
        const value = dmp.metadata[key as keyof DmpMetadata]
        error = validate(key, value)
      } else if (projectInfoKeys.includes(key as keyof ProjectInfo)) {
        const value = dmp.projectInfo[key as keyof ProjectInfo]
        error = validate(key, value)
      }
      errors[key] = error
    }
    return errors
  },
})

export const formValidState = selector<boolean>({
  key: "dmp-editor.formValidState",
  get: ({ get }) => {
    const errors = get(formValidationState)
    return Object.values(errors).every((error) => error === null)
  },
})
