import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// 役割
export const personnelRoleErca = ["研究代表者", "研究分担者", "その他"] as const

// アクセス権
export const accessRightsErca = ["公開", "共有", "制限付き公開", "非公開"] as const

// ERCA DMP 基本情報
export const ercaDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  researchPeriod: z.string(), // 研究実施年度
  researchCategory: z.string(), // 研究区分
  researchField: z.string(), // 研究領域
  projectNumber: z.string(), // 課題番号
  systematicProjectNumber: z.string(), // 体系的課題番号
  projectName: z.string(), // 研究課題名
})
export type ErcaDmp = z.infer<typeof ercaDmpSchema>

// 担当者情報
export const personnelErcaSchema = z.object({
  personnelId: z.string(), // 担当者を一意に識別するID
  role: z.enum(personnelRoleErca), // 役割 (研究代表者, 研究分担者等)
  nameAffiliationPosition: z.string(), // 氏名、所属、役職
  orcid: z.string().nullable().optional(), // ORCID
  nrid: z.string().nullable().optional(), // NRID (National Researcher ID)
})
export type PersonnelErca = z.infer<typeof personnelErcaSchema>

// 改訂履歴
export const revisionHistorySchema = z.object({
  revisionId: z.string(), // 改訂履歴を一意に識別するID
  revisionDate: z.string(), // 改訂年月日 YYYY-MM-DD
  revisionItem: z.string(), // 改訂項目
  revisionContent: z.string(), // 改訂内容
  remarks: z.string().nullable().optional(), // 備考
})
export type RevisionHistory = z.infer<typeof revisionHistorySchema>

// 研究データ情報
export const researchDataErcaSchema = z.object({
  researchDataId: z.string(), // 研究データを一意に識別するID
  dataTypeOverview: z.string(), // 取得データの種類
  relatedSubtheme: z.string().nullable().optional(), // 関連サブテーマ
  storageBackupPolicy: z.string(), // 保存・バックアップ方針
  securityPolicy: z.string(), // セキュリティ方針
  ethicalComplianceStatus: z.string(), // 倫理的問題への対処状況
  ipComplianceStatus: z.string(), // 知的財産権問題への対処状況
  dataDisclosurePolicy: z.string(), // データ公開方針
  metadataDisclosurePolicy: z.string(), // メタデータ公開方針
  dataManagementNumber: z.string(), // データ管理番号
  dataName: z.string(), // データ名
  dataDescription: z.string(), // データの説明
  version: z.string().nullable().optional(), // バージョン
  accessRights: z.enum(accessRightsErca), // アクセス権
  dataUsageConditions: z.string().nullable().optional(), // 利用条件 (ライセンス)
  repositoryUrlDoi: z.string().nullable().optional(), // リポジトリURL・DOI
  dataCreators: z.string(), // データ作成者
  dataManager: z.string(), // データ管理者
})
export type ResearchDataErca = z.infer<typeof researchDataErcaSchema>

// ERCA DMP 全体の型
export const ercaDmpFullSchema = z.object({
  dmp: ercaDmpSchema,
  personnel: z.array(personnelErcaSchema),
  revisionHistory: z.array(revisionHistorySchema),
  researchData: z.array(researchDataErcaSchema),
})
export type ErcaDmpFull = z.infer<typeof ercaDmpFullSchema>

export interface ErcaDmpFormValues {
  ercaDmpFull: ErcaDmpFull
}

// === Initial values ===

export const initErcaDmp = (user: User | null | undefined = null): ErcaDmpFull => {
  const personnel: PersonnelErca[] = user ? [{
    personnelId: generateId(),
    role: "研究代表者",
    nameAffiliationPosition: `${user.familyName} ${user.givenName}${user.affiliation ? `, ${user.affiliation}` : ""}`.trim(),
    orcid: user.orcid ?? undefined,
    nrid: user.researcherId ?? undefined,
  }] : []

  // 初期改訂履歴を作成
  const revisionHistory: RevisionHistory[] = [{
    revisionId: generateId(),
    revisionDate: todayString(),
    revisionItem: "新規作成",
    revisionContent: "DMP初版作成",
    remarks: undefined,
  }]

  return {
    dmp: {
      dmpId: generateId(),
      researchPeriod: new Date().getFullYear().toString(),
      researchCategory: "",
      researchField: "",
      projectNumber: "",
      systematicProjectNumber: "",
      projectName: "",
    },
    personnel,
    revisionHistory,
    researchData: [],
  }
}

// for Form initialization
export const initPersonnelErca = (): PersonnelErca => {
  return {
    personnelId: generateId(),
    role: "その他",
    nameAffiliationPosition: "",
    orcid: undefined,
    nrid: undefined,
  }
}

// for Form initialization
export const initRevisionHistory = (): RevisionHistory => {
  return {
    revisionId: generateId(),
    revisionDate: todayString(),
    revisionItem: "",
    revisionContent: "",
    remarks: undefined,
  }
}

// for Form initialization
export const initResearchDataErca = (): ResearchDataErca => {
  return {
    researchDataId: generateId(),
    dataTypeOverview: "",
    relatedSubtheme: undefined,
    storageBackupPolicy: "",
    securityPolicy: "",
    ethicalComplianceStatus: "",
    ipComplianceStatus: "",
    dataDisclosurePolicy: "",
    metadataDisclosurePolicy: "",
    dataManagementNumber: "",
    dataName: "",
    dataDescription: "",
    version: undefined,
    accessRights: "公開",
    dataUsageConditions: undefined,
    repositoryUrlDoi: undefined,
    dataCreators: "",
    dataManager: "",
  }
}

// === Generate Excel Data ===

export const exportToExcelErca = (ercaDmpFull: ErcaDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // ERCA DMP 基本情報
  const dmpInfo = [
    ["DMP ID", ercaDmpFull.dmp.dmpId],
    ["研究実施年度", ercaDmpFull.dmp.researchPeriod],
    ["研究区分", ercaDmpFull.dmp.researchCategory],
    ["研究領域", ercaDmpFull.dmp.researchField],
    ["課題番号", ercaDmpFull.dmp.projectNumber],
    ["体系的課題番号", ercaDmpFull.dmp.systematicProjectNumber],
    ["研究課題名", ercaDmpFull.dmp.projectName],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 担当者情報
  const personnelHeader = [
    "担当者ID",
    "役割",
    "氏名、所属、役職",
    "ORCID",
    "NRID",
  ]
  const personnelData = ercaDmpFull.personnel.map(person => [
    person.personnelId,
    person.role,
    person.nameAffiliationPosition,
    person.orcid ?? "",
    person.nrid ?? "",
  ])
  const personnelSheet = XLSX.utils.aoa_to_sheet([personnelHeader, ...personnelData])
  XLSX.utils.book_append_sheet(workbook, personnelSheet, "担当者情報")

  // 改訂履歴
  const revisionHeader = [
    "改訂ID",
    "改訂年月日",
    "改訂項目",
    "改訂内容",
    "備考",
  ]
  const revisionData = ercaDmpFull.revisionHistory.map(revision => [
    revision.revisionId,
    revision.revisionDate,
    revision.revisionItem,
    revision.revisionContent,
    revision.remarks ?? "",
  ])
  const revisionSheet = XLSX.utils.aoa_to_sheet([revisionHeader, ...revisionData])
  XLSX.utils.book_append_sheet(workbook, revisionSheet, "改訂履歴")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "取得データの種類",
    "関連サブテーマ",
    "保存・バックアップ方針",
    "セキュリティ方針",
    "倫理的問題への対処状況",
    "知的財産権問題への対処状況",
    "データ公開方針",
    "メタデータ公開方針",
    "データ管理番号",
    "データ名",
    "データの説明",
    "バージョン",
    "アクセス権",
    "利用条件 (ライセンス)",
    "リポジトリURL・DOI",
    "データ作成者",
    "データ管理者",
  ]
  const researchDataData = ercaDmpFull.researchData.map(data => [
    data.researchDataId,
    data.dataTypeOverview,
    data.relatedSubtheme ?? "",
    data.storageBackupPolicy,
    data.securityPolicy,
    data.ethicalComplianceStatus,
    data.ipComplianceStatus,
    data.dataDisclosurePolicy,
    data.metadataDisclosurePolicy,
    data.dataManagementNumber,
    data.dataName,
    data.dataDescription,
    data.version ?? "",
    data.accessRights,
    data.dataUsageConditions ?? "",
    data.repositoryUrlDoi ?? "",
    data.dataCreators,
    data.dataManager,
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

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

export const validateErcaDmpFull = (data: unknown): ErcaDmpFull => {
  return ercaDmpFullSchema.parse(data)
}

export const isErcaDmpFullValid = (data: unknown): boolean => {
  const result = ercaDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions for personnel ===

export const getPersonnelByRole = (
  ercaDmpFull: ErcaDmpFull,
  role: typeof personnelRoleErca[number],
): PersonnelErca[] => {
  return ercaDmpFull.personnel.filter(person => person.role === role)
}

export const getPrincipalInvestigator = (ercaDmpFull: ErcaDmpFull): PersonnelErca | undefined => {
  return ercaDmpFull.personnel.find(person => person.role === "研究代表者")
}

export const getCoInvestigators = (ercaDmpFull: ErcaDmpFull): PersonnelErca[] => {
  return getPersonnelByRole(ercaDmpFull, "研究分担者")
}

export interface ErcaPersonnelOption {
  value: string
  label: string
}

export const getErcaPersonnelOptions = (
  ercaDmpFull: ErcaDmpFull,
): ErcaPersonnelOption[] => {
  return ercaDmpFull.personnel.map(person => ({
    value: person.personnelId,
    label: `${person.nameAffiliationPosition} (${person.role})`,
  } as ErcaPersonnelOption))
}

export const getPersonnelById = (
  ercaDmpFull: ErcaDmpFull,
  personnelId: string | null | undefined,
): PersonnelErca | undefined => {
  if (!personnelId) return undefined
  return ercaDmpFull.personnel.find(p => p.personnelId === personnelId)
}

// === Helper functions for revision history ===

export const getLatestRevision = (ercaDmpFull: ErcaDmpFull): RevisionHistory | undefined => {
  if (ercaDmpFull.revisionHistory.length === 0) return undefined

  return ercaDmpFull.revisionHistory.reduce((latest, current) => {
    return new Date(current.revisionDate) > new Date(latest.revisionDate) ? current : latest
  })
}

export const getSortedRevisionHistory = (ercaDmpFull: ErcaDmpFull): RevisionHistory[] => {
  return [...ercaDmpFull.revisionHistory].sort(
    (a, b) => new Date(b.revisionDate).getTime() - new Date(a.revisionDate).getTime(),
  )
}

export const addRevision = (
  ercaDmpFull: ErcaDmpFull,
  item: string,
  content: string,
  remarks?: string,
): ErcaDmpFull => {
  const newRevision: RevisionHistory = {
    revisionId: generateId(),
    revisionDate: todayString(),
    revisionItem: item,
    revisionContent: content,
    remarks: remarks ?? undefined,
  }

  return {
    ...ercaDmpFull,
    revisionHistory: [...ercaDmpFull.revisionHistory, newRevision],
  }
}

// === Helper functions for research data ===

export const getResearchDataByAccessRights = (
  ercaDmpFull: ErcaDmpFull,
  accessRights: typeof accessRightsErca[number],
): ResearchDataErca[] => {
  return ercaDmpFull.researchData.filter(data => data.accessRights === accessRights)
}

export const getPublicResearchData = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return getResearchDataByAccessRights(ercaDmpFull, "公開")
}

export const getSharedResearchData = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return getResearchDataByAccessRights(ercaDmpFull, "共有")
}

export const getRestrictedResearchData = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return getResearchDataByAccessRights(ercaDmpFull, "制限付き公開")
}

export const getNonPublicResearchData = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return getResearchDataByAccessRights(ercaDmpFull, "非公開")
}

export const hasRepositoryUrl = (researchData: ResearchDataErca): boolean => {
  return !!researchData.repositoryUrlDoi && researchData.repositoryUrlDoi.trim() !== ""
}

export const getResearchDataWithRepository = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return ercaDmpFull.researchData.filter(hasRepositoryUrl)
}

export const getResearchDataWithoutRepository = (ercaDmpFull: ErcaDmpFull): ResearchDataErca[] => {
  return ercaDmpFull.researchData.filter(data => !hasRepositoryUrl(data))
}

// === Statistics helpers ===

export const getResearchDataStatistics = (ercaDmpFull: ErcaDmpFull) => {
  const total = ercaDmpFull.researchData.length
  const byAccessRights = {
    公開: getPublicResearchData(ercaDmpFull).length,
    共有: getSharedResearchData(ercaDmpFull).length,
    制限付き公開: getRestrictedResearchData(ercaDmpFull).length,
    非公開: getNonPublicResearchData(ercaDmpFull).length,
  }
  const withRepository = getResearchDataWithRepository(ercaDmpFull).length
  const personnelCount = ercaDmpFull.personnel.length
  const revisionCount = ercaDmpFull.revisionHistory.length

  return {
    total,
    byAccessRights,
    withRepository,
    personnelCount,
    revisionCount,
  }
}
