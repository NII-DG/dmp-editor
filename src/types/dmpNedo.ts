import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// 区別
export const nedoDistinction = ["新規", "修正"] as const

// 分類
export const nedoClassification = ["委託者指定", "自主管理", "その他"] as const

// 公開レベル/アクセス権
// L1: 公開、L2: 共有、L3: 制限付き公開、L4: 非公開
export const nedoAccessLevel = ["L1", "L2", "L3", "L4"] as const

// NEDO DMP 基本情報
export const nedoDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  contractor: z.string(), // 委託先
  subcontractor: z.string().nullable().optional(), // 再委託先等
  projectName: z.string(), // プロジェクト名
  projectNumber: z.string(), // プロジェクト番号
  contractManagementNumber: z.string(), // 契約管理番号
  submissionDate: z.string(), // 提出日 YYYY-MM-DD
  distinction: z.enum(nedoDistinction), // 区別（新規/修正）
  projectStartYear: z.string(), // 事業開始年度
})
export type NedoDmp = z.infer<typeof nedoDmpSchema>

// 研究データメタデータ（L3/L4のデータ用）
export const researchDataMetadataNedoSchema = z.object({
  metadataId: z.string(), // メタデータを一意に識別するID
  dataUtilizationPolicy: z.string(), // 利活用・提供方針
  dataReleaseDate: z.string().nullable().optional(), // データ公開予定日 YYYY-MM-DD
  repositoryInfo: z.string().nullable().optional(), // リポジトリ情報
  repositoryUrl: z.string().nullable().optional(), // リポジトリURL
})
export type ResearchDataMetadataNedo = z.infer<typeof researchDataMetadataNedoSchema>

// DMP内研究データ
export const researchDataDmpNedoSchema = z.object({
  researchDataDmpId: z.string(), // DMP内研究データを一意に識別するID
  dataNo: z.number(), // データNo.
  dataName: z.string(), // データの名称
  dataDescription: z.string(), // データの説明
  dataManagementInstitution: z.string(), // データ管理機関
  classification: z.enum(nedoClassification), // 分類
  accessLevel: z.enum(nedoAccessLevel), // 公開レベル/アクセス権
  confidentialityReason: z.string().nullable().optional(), // 秘匿理由
  remarks: z.string().nullable().optional(), // 備考
  metadataPublicationDate: z.string().nullable().optional(), // メタデータ掲載日（L3/4） YYYY-MM-DD
  dataAcquisitionMethod: z.string().nullable().optional(), // データの取得・収集方法（L3/4）
  approximateDataVolume: z.string().nullable().optional(), // 概略データ量
  metadata: researchDataMetadataNedoSchema.nullable().optional(), // メタデータ（L3/4の場合）
})
export type ResearchDataDmpNedo = z.infer<typeof researchDataDmpNedoSchema>

// NEDO DMP 全体の型
export const nedoDmpFullSchema = z.object({
  dmp: nedoDmpSchema,
  researchData: z.array(researchDataDmpNedoSchema),
})
export type NedoDmpFull = z.infer<typeof nedoDmpFullSchema>

export interface NedoDmpFormValues {
  nedoDmpFull: NedoDmpFull
}

// === Initial values ===

export const initNedoDmp = (user: User | null | undefined = null): NedoDmpFull => {
  return {
    dmp: {
      dmpId: generateId(),
      contractor: user?.affiliation ?? "",
      subcontractor: undefined,
      projectName: "",
      projectNumber: "",
      contractManagementNumber: "",
      submissionDate: todayString(),
      distinction: "新規",
      projectStartYear: new Date().getFullYear().toString(),
    },
    researchData: [],
  }
}

// for Form initialization
export const initResearchDataDmpNedo = (): ResearchDataDmpNedo => {
  return {
    researchDataDmpId: generateId(),
    dataNo: 1,
    dataName: "",
    dataDescription: "",
    dataManagementInstitution: "",
    classification: "自主管理",
    accessLevel: "L1",
    confidentialityReason: undefined,
    remarks: undefined,
    metadataPublicationDate: undefined,
    dataAcquisitionMethod: undefined,
    approximateDataVolume: undefined,
    metadata: undefined,
  }
}

// for Form initialization
export const initResearchDataMetadataNedo = (): ResearchDataMetadataNedo => {
  return {
    metadataId: generateId(),
    dataUtilizationPolicy: "",
    dataReleaseDate: undefined,
    repositoryInfo: undefined,
    repositoryUrl: undefined,
  }
}

// === Generate Excel Data ===

export const exportToExcelNedo = (nedoDmpFull: NedoDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // NEDO DMP 基本情報
  const dmpInfo = [
    ["DMP ID", nedoDmpFull.dmp.dmpId],
    ["委託先", nedoDmpFull.dmp.contractor],
    ["再委託先等", nedoDmpFull.dmp.subcontractor ?? ""],
    ["プロジェクト名", nedoDmpFull.dmp.projectName],
    ["プロジェクト番号", nedoDmpFull.dmp.projectNumber],
    ["契約管理番号", nedoDmpFull.dmp.contractManagementNumber],
    ["提出日", nedoDmpFull.dmp.submissionDate],
    ["区別", nedoDmpFull.dmp.distinction],
    ["事業開始年度", nedoDmpFull.dmp.projectStartYear],
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
    "公開レベル/アクセス権",
    "秘匿理由",
    "備考",
    "メタデータ掲載日（L3/4）",
    "データの取得・収集方法（L3/4）",
    "概略データ量",
  ]
  const researchDataData = nedoDmpFull.researchData.map(data => [
    data.researchDataDmpId,
    data.dataNo,
    data.dataName,
    data.dataDescription,
    data.dataManagementInstitution,
    data.classification,
    data.accessLevel,
    data.confidentialityReason ?? "",
    data.remarks ?? "",
    data.metadataPublicationDate ?? "",
    data.dataAcquisitionMethod ?? "",
    data.approximateDataVolume ?? "",
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  // 研究データメタデータ（L3/4のデータのみ）
  const metadataHeader = [
    "メタデータID",
    "研究データID",
    "利活用・提供方針",
    "データ公開予定日",
    "リポジトリ情報",
    "リポジトリURL",
  ]
  const metadataData = nedoDmpFull.researchData
    .filter(data => data.metadata !== null && data.metadata !== undefined)
    .map(data => {
      const metadata = data.metadata!
      return [
        metadata.metadataId,
        data.researchDataDmpId,
        metadata.dataUtilizationPolicy,
        metadata.dataReleaseDate ?? "",
        metadata.repositoryInfo ?? "",
        metadata.repositoryUrl ?? "",
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

export const validateNedoDmpFull = (data: unknown): NedoDmpFull => {
  return nedoDmpFullSchema.parse(data)
}

export const isNedoDmpFullValid = (data: unknown): boolean => {
  const result = nedoDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions for access levels ===

export const getAccessLevelLabel = (accessLevel: typeof nedoAccessLevel[number]): string => {
  const labels: Record<typeof nedoAccessLevel[number], string> = {
    L1: "L1: 公開",
    L2: "L2: 共有",
    L3: "L3: 制限付き公開",
    L4: "L4: 非公開",
  }
  return labels[accessLevel]
}

export const shouldHaveMetadata = (accessLevel: typeof nedoAccessLevel[number]): boolean => {
  // L3（制限付き公開）とL4（非公開）の場合はメタデータが必要
  return accessLevel === "L3" || accessLevel === "L4"
}

export const hasMetadata = (researchData: ResearchDataDmpNedo): boolean => {
  return researchData.metadata !== null && researchData.metadata !== undefined
}

export const getResearchDataWithMetadata = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return nedoDmpFull.researchData.filter(hasMetadata)
}

export const getResearchDataWithoutMetadata = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return nedoDmpFull.researchData.filter(data => !hasMetadata(data))
}

// === Helper functions for classification ===

export const getResearchDataByAccessLevel = (
  nedoDmpFull: NedoDmpFull,
  accessLevel: typeof nedoAccessLevel[number],
): ResearchDataDmpNedo[] => {
  return nedoDmpFull.researchData.filter(data => data.accessLevel === accessLevel)
}

export const getPublicResearchData = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return getResearchDataByAccessLevel(nedoDmpFull, "L1")
}

export const getSharedResearchData = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return getResearchDataByAccessLevel(nedoDmpFull, "L2")
}

export const getRestrictedResearchData = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return getResearchDataByAccessLevel(nedoDmpFull, "L3")
}

export const getNonPublicResearchData = (nedoDmpFull: NedoDmpFull): ResearchDataDmpNedo[] => {
  return getResearchDataByAccessLevel(nedoDmpFull, "L4")
}

export const getResearchDataByClassification = (
  nedoDmpFull: NedoDmpFull,
  classification: typeof nedoClassification[number],
): ResearchDataDmpNedo[] => {
  return nedoDmpFull.researchData.filter(data => data.classification === classification)
}

// === Statistics helpers ===

export const getResearchDataStatistics = (nedoDmpFull: NedoDmpFull) => {
  const total = nedoDmpFull.researchData.length
  const byAccessLevel = {
    L1: getPublicResearchData(nedoDmpFull).length,
    L2: getSharedResearchData(nedoDmpFull).length,
    L3: getRestrictedResearchData(nedoDmpFull).length,
    L4: getNonPublicResearchData(nedoDmpFull).length,
  }
  const byClassification = {
    委託者指定: getResearchDataByClassification(nedoDmpFull, "委託者指定").length,
    自主管理: getResearchDataByClassification(nedoDmpFull, "自主管理").length,
    その他: getResearchDataByClassification(nedoDmpFull, "その他").length,
  }
  const withMetadata = getResearchDataWithMetadata(nedoDmpFull).length

  return {
    total,
    byAccessLevel,
    byClassification,
    withMetadata,
  }
}
