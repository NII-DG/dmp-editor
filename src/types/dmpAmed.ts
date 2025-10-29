import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// 他課題での利活用可能性
export const dataReusability = ["可能", "不可", "未定"] as const

// 同意有無
export const consentStatus = ["有", "無", "該当なし"] as const

// 公表の可否
export const disclosureConsent = ["可", "不可"] as const

// 臨床研究情報の登録有無
export const clinicalTrialRegistration = ["有", "無", "該当なし"] as const

// AMED DMP 基本情報
export const amedDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  creationDate: z.string(), // 作成日 YYYY-MM-DD
  projectManagementNumber: z.string(), // 課題管理番号
  programName: z.string(), // 事業名／プログラム名
  projectName: z.string(), // 研究開発課題名
  projectPeriod: z.string(), // 全研究開発期間
  piAffiliation: z.string(), // 研究開発代表者 所属
  piPosition: z.string(), // 研究開発代表者 役職
  piName: z.string(), // 研究開発代表者 氏名
  dataReusability: z.enum(dataReusability), // 他課題での利活用可能性
  reasonForNotDescribingSection3: z.string().nullable().optional(), // 3を記載しない理由
  dataManagementInstitution: z.string(), // データ管理機関
  dataManagerName: z.string(), // データ管理者 氏名
  dataManagerContact: z.string(), // データ管理者 連絡先
})
export type AmedDmp = z.infer<typeof amedDmpSchema>

// 研究データ情報
export const researchDataAmedSchema = z.object({
  researchDataId: z.string(), // 研究データを一意に識別するID
  dataName: z.string(), // データの名称
  dataType1: z.string(), // データの種別①
  dataType2: z.string().nullable().optional(), // データの種別②
  dataDescription: z.string(), // データの説明
  dataCount: z.string().nullable().optional(), // データの件数
  approximateDataSizePerFile: z.string().nullable().optional(), // 概略データ量（１ファイル単位）
  approximateTotalDataSize: z.string().nullable().optional(), // 概略データ総量
  dataUtilizationPolicy: z.string(), // 利活用・提供方針
  dataSharingMethod: z.string().nullable().optional(), // データシェアリング方法
  externalCollaboratorsInfo: z.string().nullable().optional(), // 外部関係者の情報
  nonDisclosureReasonAndPeriod: z.string().nullable().optional(), // 非公開の理由と期間
  scheduledReleaseDate: z.string().nullable().optional(), // 公開予定日 YYYY-MM-DD
  consentForPersonalInfo: z.enum(consentStatus).nullable().optional(), // 個人情報利活用の同意有無
  consentDocumentUsed: z.string().nullable().optional(), // 使用した同意文書
  repositoryInfo: z.string().nullable().optional(), // リポジトリ情報
  repositoryUrlDoi: z.string().nullable().optional(), // リポジトリURL、DOI
  clinicalTrialRegistration: z.enum(clinicalTrialRegistration).nullable().optional(), // 臨床研究情報の登録有無
  clinicalTrialRegistrationUrl: z.string().nullable().optional(), // 臨床研究登録情報URL
})
export type ResearchDataAmed = z.infer<typeof researchDataAmedSchema>

// データ関連人材
export const relatedPersonnelSchema = z.object({
  personnelId: z.string(), // データ関連人材を一意に識別するID
  affiliation: z.string(), // 所属
  name: z.string(), // 氏名
  disclosureConsent: z.enum(disclosureConsent), // 所属・氏名の公表の可否
})
export type RelatedPersonnel = z.infer<typeof relatedPersonnelSchema>

// AMED DMP 全体の型
export const amedDmpFullSchema = z.object({
  dmp: amedDmpSchema,
  researchData: z.array(researchDataAmedSchema),
  relatedPersonnel: z.array(relatedPersonnelSchema),
})
export type AmedDmpFull = z.infer<typeof amedDmpFullSchema>

export interface AmedDmpFormValues {
  amedDmpFull: AmedDmpFull
}

// === Initial values ===

export const initAmedDmp = (user: User | null | undefined = null): AmedDmpFull => {
  return {
    dmp: {
      dmpId: generateId(),
      creationDate: todayString(),
      projectManagementNumber: "",
      programName: "",
      projectName: "",
      projectPeriod: "",
      piAffiliation: user?.affiliation ?? "",
      piPosition: "",
      piName: user ? `${user.familyName} ${user.givenName}`.trim() : "",
      dataReusability: "未定",
      reasonForNotDescribingSection3: undefined,
      dataManagementInstitution: user?.affiliation ?? "",
      dataManagerName: user ? `${user.familyName} ${user.givenName}`.trim() : "",
      dataManagerContact: user?.email ?? "",
    },
    researchData: [],
    relatedPersonnel: [],
  }
}

// for Form initialization
export const initResearchDataAmed = (): ResearchDataAmed => {
  return {
    researchDataId: generateId(),
    dataName: "",
    dataType1: "",
    dataType2: undefined,
    dataDescription: "",
    dataCount: undefined,
    approximateDataSizePerFile: undefined,
    approximateTotalDataSize: undefined,
    dataUtilizationPolicy: "",
    dataSharingMethod: undefined,
    externalCollaboratorsInfo: undefined,
    nonDisclosureReasonAndPeriod: undefined,
    scheduledReleaseDate: undefined,
    consentForPersonalInfo: undefined,
    consentDocumentUsed: undefined,
    repositoryInfo: undefined,
    repositoryUrlDoi: undefined,
    clinicalTrialRegistration: undefined,
    clinicalTrialRegistrationUrl: undefined,
  }
}

// for Form initialization
export const initRelatedPersonnel = (): RelatedPersonnel => {
  return {
    personnelId: generateId(),
    affiliation: "",
    name: "",
    disclosureConsent: "可",
  }
}

// === Generate Excel Data ===

export const exportToExcelAmed = (amedDmpFull: AmedDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // AMED DMP 基本情報
  const dmpInfo = [
    ["DMP ID", amedDmpFull.dmp.dmpId],
    ["作成日", amedDmpFull.dmp.creationDate],
    ["課題管理番号", amedDmpFull.dmp.projectManagementNumber],
    ["事業名／プログラム名", amedDmpFull.dmp.programName],
    ["研究開発課題名", amedDmpFull.dmp.projectName],
    ["全研究開発期間", amedDmpFull.dmp.projectPeriod],
    ["研究開発代表者 所属", amedDmpFull.dmp.piAffiliation],
    ["研究開発代表者 役職", amedDmpFull.dmp.piPosition],
    ["研究開発代表者 氏名", amedDmpFull.dmp.piName],
    ["他課題での利活用可能性", amedDmpFull.dmp.dataReusability],
    ["3を記載しない理由", amedDmpFull.dmp.reasonForNotDescribingSection3 ?? ""],
    ["データ管理機関", amedDmpFull.dmp.dataManagementInstitution],
    ["データ管理者 氏名", amedDmpFull.dmp.dataManagerName],
    ["データ管理者 連絡先", amedDmpFull.dmp.dataManagerContact],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "データの名称",
    "データの種別①",
    "データの種別②",
    "データの説明",
    "データの件数",
    "概略データ量（１ファイル単位）",
    "概略データ総量",
    "利活用・提供方針",
    "データシェアリング方法",
    "外部関係者の情報",
    "非公開の理由と期間",
    "公開予定日",
    "個人情報利活用の同意有無",
    "使用した同意文書",
    "リポジトリ情報",
    "リポジトリURL、DOI",
    "臨床研究情報の登録有無",
    "臨床研究登録情報URL",
  ]
  const researchDataData = amedDmpFull.researchData.map(data => [
    data.researchDataId,
    data.dataName,
    data.dataType1,
    data.dataType2 ?? "",
    data.dataDescription,
    data.dataCount ?? "",
    data.approximateDataSizePerFile ?? "",
    data.approximateTotalDataSize ?? "",
    data.dataUtilizationPolicy,
    data.dataSharingMethod ?? "",
    data.externalCollaboratorsInfo ?? "",
    data.nonDisclosureReasonAndPeriod ?? "",
    data.scheduledReleaseDate ?? "",
    data.consentForPersonalInfo ?? "",
    data.consentDocumentUsed ?? "",
    data.repositoryInfo ?? "",
    data.repositoryUrlDoi ?? "",
    data.clinicalTrialRegistration ?? "",
    data.clinicalTrialRegistrationUrl ?? "",
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  // データ関連人材情報
  const personnelHeader = [
    "人材ID",
    "所属",
    "氏名",
    "所属・氏名の公表の可否",
  ]
  const personnelData = amedDmpFull.relatedPersonnel.map(person => [
    person.personnelId,
    person.affiliation,
    person.name,
    person.disclosureConsent,
  ])
  const personnelSheet = XLSX.utils.aoa_to_sheet([personnelHeader, ...personnelData])
  XLSX.utils.book_append_sheet(workbook, personnelSheet, "データ関連人材情報")

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

export const validateAmedDmpFull = (data: unknown): AmedDmpFull => {
  return amedDmpFullSchema.parse(data)
}

export const isAmedDmpFullValid = (data: unknown): boolean => {
  const result = amedDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions ===

export interface AmedRelatedPersonnelOption {
  value: string
  label: string
}

export const getRelatedPersonnelOptions = (
  amedDmpFull: AmedDmpFull,
): AmedRelatedPersonnelOption[] => {
  return amedDmpFull.relatedPersonnel.map(person => ({
    value: person.personnelId,
    label: `${person.name} (${person.affiliation})`,
  } as AmedRelatedPersonnelOption))
}

export const getRelatedPersonnelById = (
  amedDmpFull: AmedDmpFull,
  personnelId: string | null | undefined,
): RelatedPersonnel | undefined => {
  if (!personnelId) return undefined
  return amedDmpFull.relatedPersonnel.find(p => p.personnelId === personnelId)
}

export const hasPersonalInfo = (researchData: ResearchDataAmed): boolean => {
  return researchData.consentForPersonalInfo === "有"
}

export const hasClinicalTrial = (researchData: ResearchDataAmed): boolean => {
  return researchData.clinicalTrialRegistration === "有"
}

export const isPublicData = (researchData: ResearchDataAmed): boolean => {
  // 非公開の理由と期間が設定されていない場合は公開データとみなす
  return !researchData.nonDisclosureReasonAndPeriod || researchData.nonDisclosureReasonAndPeriod.trim() === ""
}

export const getPublicResearchData = (amedDmpFull: AmedDmpFull): ResearchDataAmed[] => {
  return amedDmpFull.researchData.filter(isPublicData)
}

export const getNonPublicResearchData = (amedDmpFull: AmedDmpFull): ResearchDataAmed[] => {
  return amedDmpFull.researchData.filter(data => !isPublicData(data))
}
