import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// DMP 基本情報
export const dmpJspsSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  dmpCreationDate: z.string(), // DMP作成年月日 YYYY-MM-DD
  dmpLastUpdatedDate: z.string(), // DMP最終更新年月日 YYYY-MM-DD
  projectNumber: z.string(), // 研究課題番号
})
export type DmpJsps = z.infer<typeof dmpJspsSchema>

// 担当者情報
export const personnelRoleJsps = ["研究代表者", "研究分担者", "取得者・収集者", "管理者", "その他"] as const
export const personnelJspsSchema = z.object({
  personnelId: z.string(), // 担当者を一意に識別するID
  serialNumber: z.string(), // 計画書内通し番号
  role: z.enum(personnelRoleJsps), // 役割
  name: z.string(), // 氏名
  affiliationPosition: z.string(), // 所属・役職
  researcherNumber: z.string().nullable().optional(), // 研究者番号
  contact: z.string().nullable().optional(), // 連絡先
})
export type PersonnelJsps = z.infer<typeof personnelJspsSchema>

// 公開・提供方針
export const dataSharingPolicy = ["公開", "共有", "非公開", "未定"] as const

// 研究データ情報
export const researchDataJspsSchema = z.object({
  researchDataId: z.string(), // 研究データを一意に識別するID
  no: z.number(), // No.
  dataName: z.string(), // 研究データの名称
  dataSummary: z.string(), // 研究データの概要
  dataCollectorRef: z.string().nullable().optional(), // 取得者・収集者 (担当者への参照: personnelId)
  dataManagerRef: z.string().nullable().optional(), // 管理者 (担当者への参照: personnelId)
  sensitiveInfoPolicy: z.string().nullable().optional(), // 機微情報の取り扱い方針
  dataSharingPolicy: z.enum(dataSharingPolicy), // 公開・提供方針
  dataSharingPolicyDetail: z.string().nullable().optional(), // 公開・提供方針詳細
  dataSharingLocation: z.string().nullable().optional(), // 公開・提供場所
  dataReleaseDate: z.string().nullable().optional(), // 公開日（予定） YYYY-MM-DD
})
export type ResearchDataJsps = z.infer<typeof researchDataJspsSchema>

// DMP JSPS 全体の型
export const dmpJspsFullSchema = z.object({
  dmp: dmpJspsSchema,
  personnel: z.array(personnelJspsSchema),
  researchData: z.array(researchDataJspsSchema),
})
export type DmpJspsFull = z.infer<typeof dmpJspsFullSchema>

export interface DmpJspsFormValues {
  dmpJspsFull: DmpJspsFull
}

// === Initial values ===

export const initDmpJsps = (user: User | null | undefined = null): DmpJspsFull => {
  const personnel: PersonnelJsps[] = user ? [{
    personnelId: generateId(),
    serialNumber: "1",
    role: "研究代表者",
    name: `${user.familyName} ${user.givenName}`.trim(),
    affiliationPosition: user.affiliation ?? "",
    researcherNumber: user.researcherId ?? undefined,
    contact: user.email ?? undefined,
  }] : []

  return {
    dmp: {
      dmpId: generateId(),
      dmpCreationDate: todayString(),
      dmpLastUpdatedDate: todayString(),
      projectNumber: "",
    },
    personnel,
    researchData: [],
  }
}

// for Form initialization
export const initPersonnelJsps = (): PersonnelJsps => {
  return {
    personnelId: generateId(),
    serialNumber: "",
    role: "その他",
    name: "",
    affiliationPosition: "",
    researcherNumber: undefined,
    contact: undefined,
  }
}

// for Form initialization
export const initResearchDataJsps = (): ResearchDataJsps => {
  return {
    researchDataId: generateId(),
    no: 1,
    dataName: "",
    dataSummary: "",
    dataCollectorRef: undefined,
    dataManagerRef: undefined,
    sensitiveInfoPolicy: undefined,
    dataSharingPolicy: "公開",
    dataSharingPolicyDetail: undefined,
    dataSharingLocation: undefined,
    dataReleaseDate: undefined,
  }
}

// === Generate Excel Data ===

export const exportToExcelJsps = (dmpJspsFull: DmpJspsFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // DMP 基本情報
  const dmpInfo = [
    ["DMP ID", dmpJspsFull.dmp.dmpId],
    ["DMP 作成年月日", dmpJspsFull.dmp.dmpCreationDate],
    ["DMP 最終更新年月日", dmpJspsFull.dmp.dmpLastUpdatedDate],
    ["研究課題番号", dmpJspsFull.dmp.projectNumber],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 担当者情報
  const personnelHeader = [
    "担当者ID",
    "計画書内通し番号",
    "役割",
    "氏名",
    "所属・役職",
    "研究者番号",
    "連絡先",
  ]
  const personnelData = dmpJspsFull.personnel.map(person => [
    person.personnelId,
    person.serialNumber,
    person.role,
    person.name,
    person.affiliationPosition,
    person.researcherNumber ?? "",
    person.contact ?? "",
  ])
  const personnelSheet = XLSX.utils.aoa_to_sheet([personnelHeader, ...personnelData])
  XLSX.utils.book_append_sheet(workbook, personnelSheet, "担当者情報")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "No.",
    "研究データの名称",
    "研究データの概要",
    "取得者・収集者",
    "管理者",
    "機微情報の取り扱い方針",
    "公開・提供方針",
    "公開・提供方針詳細",
    "公開・提供場所",
    "公開日（予定）",
  ]
  const researchDataData = dmpJspsFull.researchData.map(data => {
    // Find personnel names by reference
    const collectorName = data.dataCollectorRef
      ? dmpJspsFull.personnel.find(p => p.personnelId === data.dataCollectorRef)?.name ?? ""
      : ""
    const managerName = data.dataManagerRef
      ? dmpJspsFull.personnel.find(p => p.personnelId === data.dataManagerRef)?.name ?? ""
      : ""

    return [
      data.researchDataId,
      data.no,
      data.dataName,
      data.dataSummary,
      collectorName,
      managerName,
      data.sensitiveInfoPolicy ?? "",
      data.dataSharingPolicy,
      data.dataSharingPolicyDetail ?? "",
      data.dataSharingLocation ?? "",
      data.dataReleaseDate ?? "",
    ]
  })
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

// === Utility functions ===

export const getPersonnelNameById = (
  dmpJspsFull: DmpJspsFull,
  personnelId: string | null | undefined,
): string => {
  if (!personnelId) return ""
  const person = dmpJspsFull.personnel.find(p => p.personnelId === personnelId)
  return person?.name ?? ""
}

export interface JspsPersonnelOption {
  value: string
  label: string
}

export const listingJspsPersonnelOptions = (dmpJspsFull: DmpJspsFull): JspsPersonnelOption[] => {
  return dmpJspsFull.personnel.map(person => ({
    value: person.personnelId,
    label: `${person.serialNumber}: ${person.name} (${person.role})`,
  } as JspsPersonnelOption))
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const todayString = (): string => {
  // YYYY-MM-DD
  return new Date().toISOString().split("T")[0]
}

// === Validation helpers ===

export const validateDmpJspsFull = (data: unknown): DmpJspsFull => {
  return dmpJspsFullSchema.parse(data)
}

export const isDmpJspsFullValid = (data: unknown): boolean => {
  const result = dmpJspsFullSchema.safeParse(data)
  return result.success
}
