import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// データレベル
// レベル1-2: 非公開・組織内限定、レベル3: 共有、レベル4-5: 公開
export const naroDataLevel = ["レベル1", "レベル2", "レベル3", "レベル4", "レベル5"] as const

// NARO DMP 基本情報
export const naroDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  organizationInfo: z.string(), // 領域（チーム・グループ）
  policyLevel12: z.string(), // 方針（レベル1・2）
  policyLevel3: z.string(), // 方針（レベル3）
  policyLevel45: z.string(), // 方針（レベル4・5）
})
export type NaroDmp = z.infer<typeof naroDmpSchema>

// データ共有情報（レベル3の場合）
export const dataSharingInfoSchema = z.object({
  projectName: z.string(), // 共同研究・プロジェクト名
  sharingConditions: z.string(), // 共有条件
})
export type DataSharingInfo = z.infer<typeof dataSharingInfoSchema>

// データ公開情報（レベル4・5の場合）
export const dataPublicationInfoSchema = z.object({
  publicationMethod: z.string(), // 公開方法（URL）
  registrationConditions: z.string(), // 登録条件
})
export type DataPublicationInfo = z.infer<typeof dataPublicationInfoSchema>

// 研究データ情報
export const researchDataNaroSchema = z.object({
  researchDataId: z.string(), // 研究データを一意に識別するID
  dataNo: z.number(), // データNo.
  classification: z.string(), // 分類
  dataName: z.string(), // 登録データ名
  dataSummary: z.string(), // 収録データ概要
  level: z.enum(naroDataLevel), // レベル
  notes: z.string().nullable().optional(), // 備考
  usagePurpose: z.string().nullable().optional(), // 想定利用用途
  utilizationPromotion: z.string().nullable().optional(), // 利活用促進の取り組み
  sharingInfo: dataSharingInfoSchema.nullable().optional(), // データ共有情報（レベル3の場合）
  publicationInfo: dataPublicationInfoSchema.nullable().optional(), // データ公開情報（レベル4・5の場合）
})
export type ResearchDataNaro = z.infer<typeof researchDataNaroSchema>

// NARO DMP 全体の型
export const naroDmpFullSchema = z.object({
  dmp: naroDmpSchema,
  researchData: z.array(researchDataNaroSchema),
})
export type NaroDmpFull = z.infer<typeof naroDmpFullSchema>

export interface NaroDmpFormValues {
  naroDmpFull: NaroDmpFull
}

// === Initial values ===

export const initNaroDmp = (user: User | null | undefined = null): NaroDmpFull => {
  return {
    dmp: {
      dmpId: generateId(),
      organizationInfo: user?.affiliation ?? "",
      policyLevel12: "",
      policyLevel3: "",
      policyLevel45: "",
    },
    researchData: [],
  }
}

// for Form initialization
export const initResearchDataNaro = (): ResearchDataNaro => {
  return {
    researchDataId: generateId(),
    dataNo: 1,
    classification: "",
    dataName: "",
    dataSummary: "",
    level: "レベル1",
    notes: undefined,
    usagePurpose: undefined,
    utilizationPromotion: undefined,
    sharingInfo: undefined,
    publicationInfo: undefined,
  }
}

// for Form initialization
export const initDataSharingInfo = (): DataSharingInfo => {
  return {
    projectName: "",
    sharingConditions: "",
  }
}

// for Form initialization
export const initDataPublicationInfo = (): DataPublicationInfo => {
  return {
    publicationMethod: "",
    registrationConditions: "",
  }
}

// === Generate Excel Data ===

export const exportToExcelNaro = (naroDmpFull: NaroDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // NARO DMP 基本情報
  const dmpInfo = [
    ["DMP ID", naroDmpFull.dmp.dmpId],
    ["領域（チーム・グループ）", naroDmpFull.dmp.organizationInfo],
    ["方針（レベル1・2）", naroDmpFull.dmp.policyLevel12],
    ["方針（レベル3）", naroDmpFull.dmp.policyLevel3],
    ["方針（レベル4・5）", naroDmpFull.dmp.policyLevel45],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "データNo.",
    "分類",
    "登録データ名",
    "収録データ概要",
    "レベル",
    "備考",
    "想定利用用途",
    "利活用促進の取り組み",
  ]
  const researchDataData = naroDmpFull.researchData.map(data => [
    data.researchDataId,
    data.dataNo,
    data.classification,
    data.dataName,
    data.dataSummary,
    data.level,
    data.notes ?? "",
    data.usagePurpose ?? "",
    data.utilizationPromotion ?? "",
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  // データ共有情報（レベル3のデータのみ）
  const sharingHeader = [
    "研究データID",
    "共同研究・プロジェクト名",
    "共有条件",
  ]
  const sharingData = naroDmpFull.researchData
    .filter(data => data.sharingInfo !== null && data.sharingInfo !== undefined)
    .map(data => {
      const sharingInfo = data.sharingInfo!
      return [
        data.researchDataId,
        sharingInfo.projectName,
        sharingInfo.sharingConditions,
      ]
    })

  if (sharingData.length > 0) {
    const sharingSheet = XLSX.utils.aoa_to_sheet([sharingHeader, ...sharingData])
    XLSX.utils.book_append_sheet(workbook, sharingSheet, "データ共有情報")
  }

  // データ公開情報（レベル4・5のデータのみ）
  const publicationHeader = [
    "研究データID",
    "公開方法（URL）",
    "登録条件",
  ]
  const publicationData = naroDmpFull.researchData
    .filter(data => data.publicationInfo !== null && data.publicationInfo !== undefined)
    .map(data => {
      const publicationInfo = data.publicationInfo!
      return [
        data.researchDataId,
        publicationInfo.publicationMethod,
        publicationInfo.registrationConditions,
      ]
    })

  if (publicationData.length > 0) {
    const publicationSheet = XLSX.utils.aoa_to_sheet([publicationHeader, ...publicationData])
    XLSX.utils.book_append_sheet(workbook, publicationSheet, "データ公開情報")
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

export const validateNaroDmpFull = (data: unknown): NaroDmpFull => {
  return naroDmpFullSchema.parse(data)
}

export const isNaroDmpFullValid = (data: unknown): boolean => {
  const result = naroDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions for data levels ===

export const getDataLevelLabel = (level: typeof naroDataLevel[number]): string => {
  const labels: Record<typeof naroDataLevel[number], string> = {
    レベル1: "レベル1: 非公開",
    レベル2: "レベル2: 組織内限定",
    レベル3: "レベル3: 共有",
    レベル4: "レベル4: 公開",
    レベル5: "レベル5: 完全公開",
  }
  return labels[level]
}

export const shouldHaveSharingInfo = (level: typeof naroDataLevel[number]): boolean => {
  // レベル3（共有）の場合は共有情報が必要
  return level === "レベル3"
}

export const shouldHavePublicationInfo = (level: typeof naroDataLevel[number]): boolean => {
  // レベル4・5（公開）の場合は公開情報が必要
  return level === "レベル4" || level === "レベル5"
}

export const hasSharingInfo = (researchData: ResearchDataNaro): boolean => {
  return researchData.sharingInfo !== null && researchData.sharingInfo !== undefined
}

export const hasPublicationInfo = (researchData: ResearchDataNaro): boolean => {
  return researchData.publicationInfo !== null && researchData.publicationInfo !== undefined
}

// === Helper functions for data classification by level ===

export const getResearchDataByLevel = (
  naroDmpFull: NaroDmpFull,
  level: typeof naroDataLevel[number],
): ResearchDataNaro[] => {
  return naroDmpFull.researchData.filter(data => data.level === level)
}

export const getNonPublicResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return getResearchDataByLevel(naroDmpFull, "レベル1")
}

export const getOrganizationOnlyResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return getResearchDataByLevel(naroDmpFull, "レベル2")
}

export const getSharedResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return getResearchDataByLevel(naroDmpFull, "レベル3")
}

export const getPublicResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return getResearchDataByLevel(naroDmpFull, "レベル4")
}

export const getFullyPublicResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return getResearchDataByLevel(naroDmpFull, "レベル5")
}

export const getAllPublicResearchData = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return naroDmpFull.researchData.filter(
    data => data.level === "レベル4" || data.level === "レベル5",
  )
}

export const getResearchDataWithSharingInfo = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return naroDmpFull.researchData.filter(hasSharingInfo)
}

export const getResearchDataWithPublicationInfo = (naroDmpFull: NaroDmpFull): ResearchDataNaro[] => {
  return naroDmpFull.researchData.filter(hasPublicationInfo)
}

// === Helper functions for classification ===

export const getResearchDataByClassification = (
  naroDmpFull: NaroDmpFull,
  classification: string,
): ResearchDataNaro[] => {
  return naroDmpFull.researchData.filter(data => data.classification === classification)
}

export const getUniqueClassifications = (naroDmpFull: NaroDmpFull): string[] => {
  const classifications = naroDmpFull.researchData.map(data => data.classification)
  return Array.from(new Set(classifications)).filter(c => c.trim() !== "")
}

// === Statistics helpers ===

export const getResearchDataStatistics = (naroDmpFull: NaroDmpFull) => {
  const total = naroDmpFull.researchData.length
  const byLevel = {
    レベル1: getNonPublicResearchData(naroDmpFull).length,
    レベル2: getOrganizationOnlyResearchData(naroDmpFull).length,
    レベル3: getSharedResearchData(naroDmpFull).length,
    レベル4: getPublicResearchData(naroDmpFull).length,
    レベル5: getFullyPublicResearchData(naroDmpFull).length,
  }
  const withSharingInfo = getResearchDataWithSharingInfo(naroDmpFull).length
  const withPublicationInfo = getResearchDataWithPublicationInfo(naroDmpFull).length
  const uniqueClassifications = getUniqueClassifications(naroDmpFull)

  return {
    total,
    byLevel,
    withSharingInfo,
    withPublicationInfo,
    uniqueClassifications,
    classificationCount: uniqueClassifications.length,
  }
}

// === Data integrity helpers ===

export const validateDataIntegrity = (naroDmpFull: NaroDmpFull): string[] => {
  const errors: string[] = []

  naroDmpFull.researchData.forEach(data => {
    // レベル3のデータには共有情報が必要
    if (shouldHaveSharingInfo(data.level) && !hasSharingInfo(data)) {
      errors.push(`データNo.${data.dataNo}: レベル3のデータには共有情報が必要です`)
    }

    // レベル4・5のデータには公開情報が必要
    if (shouldHavePublicationInfo(data.level) && !hasPublicationInfo(data)) {
      errors.push(`データNo.${data.dataNo}: レベル4・5のデータには公開情報が必要です`)
    }

    // レベル1・2のデータに共有情報や公開情報があってはならない
    if ((data.level === "レベル1" || data.level === "レベル2") && (hasSharingInfo(data) || hasPublicationInfo(data))) {
      errors.push(`データNo.${data.dataNo}: レベル1・2のデータに共有情報や公開情報は不要です`)
    }

    // レベル3のデータに公開情報があってはならない
    if (data.level === "レベル3" && hasPublicationInfo(data)) {
      errors.push(`データNo.${data.dataNo}: レベル3のデータに公開情報は不要です`)
    }

    // レベル4・5のデータに共有情報があってはならない
    if ((data.level === "レベル4" || data.level === "レベル5") && hasSharingInfo(data)) {
      errors.push(`データNo.${data.dataNo}: レベル4・5のデータに共有情報は不要です`)
    }
  })

  return errors
}

export const isDataIntegrityValid = (naroDmpFull: NaroDmpFull): boolean => {
  return validateDataIntegrity(naroDmpFull).length === 0
}
