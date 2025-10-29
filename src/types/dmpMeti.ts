import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// 区別
export const metiDistinction = ["新規", "修正"] as const

// METI DMP 基本情報
export const metiDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  distinction: z.enum(metiDistinction), // 区別（新規/修正）
  contractDate: z.string(), // 契約締結日 YYYY-MM-DD
  contractTitle: z.string(), // 契約件名
  organizationName: z.string(), // 法人名等
})
export type MetiDmp = z.infer<typeof metiDmpSchema>

// 分類
export const dataClassification = ["委託者指定", "自主管理"] as const

// データのアクセス権（レベル1-4）
export const dataAccessLevel = ["レベル1", "レベル2", "レベル3", "レベル4"] as const

// メタデータのアクセス権
export const metadataAccessRights = ["公開", "共有", "非公開", "未定"] as const

// 研究データメタデータ（公開データの場合のみ）
export const researchDataMetadataSchema = z.object({
  systematicNumber: z.string(), // 体系的番号
  projectName: z.string(), // プロジェクト名
  publicationDate: z.string(), // 掲載日・掲載更新日 YYYY-MM-DD
  dataUtilizationPolicy: z.string(), // 利活用・提供方針
  accessRights: z.enum(metadataAccessRights), // アクセス権（公開/共有など）
  repositoryUrlDoi: z.string().nullable().optional(), // リポジトリURL・DOIリンク
  dataCreatorJa: z.string(), // データ作成者（日本語）
  dataManagerJa: z.string(), // データ管理者（日本語）
  dataManagerContact: z.string(), // データ管理者の連絡先
})
export type ResearchDataMetadata = z.infer<typeof researchDataMetadataSchema>

// DMP内の研究データ
export const researchDataDmpSchema = z.object({
  researchDataDmpId: z.string(), // DMP内の研究データを一意に識別するID
  dataNo: z.number(), // データNo.
  dataName: z.string(), // データの名称
  dataDescription: z.string(), // データの説明
  dataManagementInstitution: z.string(), // データ管理機関
  classification: z.enum(dataClassification), // 分類（委託者指定/自主管理）
  dataAccessLevel: z.enum(dataAccessLevel), // データのアクセス権（レベル1-4）
  confidentialityReason: z.string().nullable().optional(), // 秘匿理由
  remarks: z.string().nullable().optional(), // 備考
  metadata: researchDataMetadataSchema.nullable().optional(), // メタデータ（公開データの場合のみ）
})
export type ResearchDataDmp = z.infer<typeof researchDataDmpSchema>

// METI DMP 全体の型
export const metiDmpFullSchema = z.object({
  dmp: metiDmpSchema,
  researchData: z.array(researchDataDmpSchema),
})
export type MetiDmpFull = z.infer<typeof metiDmpFullSchema>

export interface MetiDmpFormValues {
  metiDmpFull: MetiDmpFull
}

// === Initial values ===

export const initMetiDmp = (user: User | null | undefined = null): MetiDmpFull => {
  return {
    dmp: {
      dmpId: generateId(),
      distinction: "新規",
      contractDate: todayString(),
      contractTitle: "",
      organizationName: user?.affiliation ?? "",
    },
    researchData: [],
  }
}

// for Form initialization
export const initResearchDataDmp = (): ResearchDataDmp => {
  return {
    researchDataDmpId: generateId(),
    dataNo: 1,
    dataName: "",
    dataDescription: "",
    dataManagementInstitution: "",
    classification: "自主管理",
    dataAccessLevel: "レベル1",
    confidentialityReason: undefined,
    remarks: undefined,
    metadata: undefined,
  }
}

// for Form initialization
export const initResearchDataMetadata = (): ResearchDataMetadata => {
  return {
    systematicNumber: "",
    projectName: "",
    publicationDate: todayString(),
    dataUtilizationPolicy: "",
    accessRights: "公開",
    repositoryUrlDoi: undefined,
    dataCreatorJa: "",
    dataManagerJa: "",
    dataManagerContact: "",
  }
}

// === Generate Excel Data ===

export const exportToExcelMeti = (metiDmpFull: MetiDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // METI DMP 基本情報
  const dmpInfo = [
    ["DMP ID", metiDmpFull.dmp.dmpId],
    ["区別", metiDmpFull.dmp.distinction],
    ["契約締結日", metiDmpFull.dmp.contractDate],
    ["契約件名", metiDmpFull.dmp.contractTitle],
    ["法人名等", metiDmpFull.dmp.organizationName],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "データNo.",
    "データの名称",
    "データの説明",
    "データ管理機関",
    "分類",
    "データのアクセス権",
    "秘匿理由",
    "備考",
  ]
  const researchDataData = metiDmpFull.researchData.map(data => [
    data.researchDataDmpId,
    data.dataNo,
    data.dataName,
    data.dataDescription,
    data.dataManagementInstitution,
    data.classification,
    data.dataAccessLevel,
    data.confidentialityReason ?? "",
    data.remarks ?? "",
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  // 研究データメタデータ（公開データのみ）
  const metadataHeader = [
    "研究データID",
    "体系的番号",
    "プロジェクト名",
    "掲載日・掲載更新日",
    "利活用・提供方針",
    "アクセス権",
    "リポジトリURL・DOIリンク",
    "データ作成者（日本語）",
    "データ管理者（日本語）",
    "データ管理者の連絡先",
  ]
  const metadataData = metiDmpFull.researchData
    .filter(data => data.metadata !== null && data.metadata !== undefined)
    .map(data => {
      const metadata = data.metadata!
      return [
        data.researchDataDmpId,
        metadata.systematicNumber,
        metadata.projectName,
        metadata.publicationDate,
        metadata.dataUtilizationPolicy,
        metadata.accessRights,
        metadata.repositoryUrlDoi ?? "",
        metadata.dataCreatorJa,
        metadata.dataManagerJa,
        metadata.dataManagerContact,
      ]
    })

  if (metadataData.length > 0) {
    const metadataSheet = XLSX.utils.aoa_to_sheet([metadataHeader, ...metadataData])
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "研究データメタデータ")
  }

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

// === Utility functions ===

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const todayString = (): string => {
  // YYYY-MM-DD
  return new Date().toISOString().split("T")[0]
}

// === Validation helpers ===

export const validateMetiDmpFull = (data: unknown): MetiDmpFull => {
  return metiDmpFullSchema.parse(data)
}

export const isMetiDmpFullValid = (data: unknown): boolean => {
  const result = metiDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions for metadata ===

export const hasMetadata = (researchData: ResearchDataDmp): boolean => {
  return researchData.metadata !== null && researchData.metadata !== undefined
}

export const shouldHaveMetadata = (accessLevel: typeof dataAccessLevel[number]): boolean => {
  // レベル1（公開）の場合はメタデータが必要
  return accessLevel === "レベル1"
}

export const getResearchDataWithMetadata = (metiDmpFull: MetiDmpFull): ResearchDataDmp[] => {
  return metiDmpFull.researchData.filter(hasMetadata)
}

export const getResearchDataWithoutMetadata = (metiDmpFull: MetiDmpFull): ResearchDataDmp[] => {
  return metiDmpFull.researchData.filter(data => !hasMetadata(data))
}
