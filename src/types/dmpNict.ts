import * as XLSX from "xlsx"
import { z } from "zod"

import { User } from "@/hooks/useUser"

// === Type definitions ===

// 作成種別
export const creationType = ["新規", "更新", "修正"] as const

// 公開レベル
export const accessLevel = ["公開", "限定公開", "非公開", "未定"] as const

// NICT DMP 基本情報
export const nictDmpSchema = z.object({
  dmpId: z.string(), // DMPを一意に識別するID
  creationType: z.enum(creationType), // 作成種別
  managementNumber: z.string(), // 管理番号
  creationDate: z.string(), // 作成日時 YYYY-MM-DD
  responsiblePerson: z.string(), // 責任者
  affiliation: z.string(), // 所属
  position: z.string(), // 役職等
  projectType: z.string(), // 事業種別
  projectNumber: z.string(), // 課題番号
  projectName: z.string(), // 研究開発プロジェクト名
  researchPeriod: z.string(), // 研究開発期間
})
export type NictDmp = z.infer<typeof nictDmpSchema>

// 特記事項（データ分類の詳細情報）
export const classificationNoteSchema = z.object({
  noteId: z.string(), // 特記事項を一意に識別するID
  dataClassificationDetail: z.string(), // 特記事項でのデータ分類
  dataDescriptionDetail: z.string(), // 特記事項でのデータの説明
})
export type ClassificationNote = z.infer<typeof classificationNoteSchema>

// 研究データ情報
export const researchDataNictSchema = z.object({
  researchDataId: z.string(), // 研究データを一意に識別するID
  dataNo: z.number(), // データNo.
  dataName: z.string(), // 研究開発データの名称
  dataDescription: z.string(), // 研究開発データの説明
  dataManager: z.string(), // データ管理者
  dataClassification: z.string(), // データ分類
  identifier: z.string().nullable().optional(), // 識別記号（DOI等）
  pdReviewRequired: z.boolean(), // PD審議対象か
  pdReviewStatus: z.string().nullable().optional(), // PD審査状況等
  bioethicsReviewRequired: z.boolean(), // 生体倫理審査対象か
  bioethicsReviewStatus: z.string().nullable().optional(), // 生体倫理審査状況等
  storageLocation: z.string(), // 主たるデータの保管場所
  dataSize: z.string().nullable().optional(), // データサイズ
  accessLevel: z.enum(accessLevel), // 公開レベル
  accessLevelDetails: z.string().nullable().optional(), // 公開レベル詳細
  updateDate: z.string(), // 更新日 YYYY-MM-DD
  classificationNote: classificationNoteSchema.nullable().optional(), // 特記事項
})
export type ResearchDataNict = z.infer<typeof researchDataNictSchema>

// NICT DMP 全体の型
export const nictDmpFullSchema = z.object({
  dmp: nictDmpSchema,
  researchData: z.array(researchDataNictSchema),
})
export type NictDmpFull = z.infer<typeof nictDmpFullSchema>

export interface NictDmpFormValues {
  nictDmpFull: NictDmpFull
}

// === Initial values ===

export const initNictDmp = (user: User | null | undefined = null): NictDmpFull => {
  return {
    dmp: {
      dmpId: generateId(),
      creationType: "新規",
      managementNumber: "",
      creationDate: todayString(),
      responsiblePerson: user ? `${user.familyName} ${user.givenName}`.trim() : "",
      affiliation: user?.affiliation ?? "",
      position: "",
      projectType: "",
      projectNumber: "",
      projectName: "",
      researchPeriod: "",
    },
    researchData: [],
  }
}

// for Form initialization
export const initResearchDataNict = (): ResearchDataNict => {
  return {
    researchDataId: generateId(),
    dataNo: 1,
    dataName: "",
    dataDescription: "",
    dataManager: "",
    dataClassification: "",
    identifier: undefined,
    pdReviewRequired: false,
    pdReviewStatus: undefined,
    bioethicsReviewRequired: false,
    bioethicsReviewStatus: undefined,
    storageLocation: "",
    dataSize: undefined,
    accessLevel: "公開",
    accessLevelDetails: undefined,
    updateDate: todayString(),
    classificationNote: undefined,
  }
}

// for Form initialization
export const initClassificationNote = (): ClassificationNote => {
  return {
    noteId: generateId(),
    dataClassificationDetail: "",
    dataDescriptionDetail: "",
  }
}

// === Generate Excel Data ===

export const exportToExcelNict = (nictDmpFull: NictDmpFull): Blob => {
  const workbook = XLSX.utils.book_new()

  // NICT DMP 基本情報
  const dmpInfo = [
    ["DMP ID", nictDmpFull.dmp.dmpId],
    ["作成種別", nictDmpFull.dmp.creationType],
    ["管理番号", nictDmpFull.dmp.managementNumber],
    ["作成日時", nictDmpFull.dmp.creationDate],
    ["責任者", nictDmpFull.dmp.responsiblePerson],
    ["所属", nictDmpFull.dmp.affiliation],
    ["役職等", nictDmpFull.dmp.position],
    ["事業種別", nictDmpFull.dmp.projectType],
    ["課題番号", nictDmpFull.dmp.projectNumber],
    ["研究開発プロジェクト名", nictDmpFull.dmp.projectName],
    ["研究開発期間", nictDmpFull.dmp.researchPeriod],
  ]
  const dmpInfoSheet = XLSX.utils.aoa_to_sheet(dmpInfo)
  XLSX.utils.book_append_sheet(workbook, dmpInfoSheet, "DMP基本情報")

  // 研究データ情報
  const researchDataHeader = [
    "研究データID",
    "データNo.",
    "研究開発データの名称",
    "研究開発データの説明",
    "データ管理者",
    "データ分類",
    "識別記号（DOI等）",
    "PD審議対象か",
    "PD審査状況等",
    "生体倫理審査対象か",
    "生体倫理審査状況等",
    "主たるデータの保管場所",
    "データサイズ",
    "公開レベル",
    "公開レベル詳細",
    "更新日",
  ]
  const researchDataData = nictDmpFull.researchData.map(data => [
    data.researchDataId,
    data.dataNo,
    data.dataName,
    data.dataDescription,
    data.dataManager,
    data.dataClassification,
    data.identifier ?? "",
    data.pdReviewRequired ? "対象" : "対象外",
    data.pdReviewStatus ?? "",
    data.bioethicsReviewRequired ? "対象" : "対象外",
    data.bioethicsReviewStatus ?? "",
    data.storageLocation,
    data.dataSize ?? "",
    data.accessLevel,
    data.accessLevelDetails ?? "",
    data.updateDate,
  ])
  const researchDataSheet = XLSX.utils.aoa_to_sheet([researchDataHeader, ...researchDataData])
  XLSX.utils.book_append_sheet(workbook, researchDataSheet, "研究データ情報")

  // 特記事項（データ分類の詳細）
  const classificationNoteHeader = [
    "特記事項ID",
    "研究データID",
    "データ分類詳細",
    "データの説明詳細",
  ]
  const classificationNoteData = nictDmpFull.researchData
    .filter(data => data.classificationNote !== null && data.classificationNote !== undefined)
    .map(data => {
      const note = data.classificationNote!
      return [
        note.noteId,
        data.researchDataId,
        note.dataClassificationDetail,
        note.dataDescriptionDetail,
      ]
    })

  if (classificationNoteData.length > 0) {
    const classificationNoteSheet = XLSX.utils.aoa_to_sheet([classificationNoteHeader, ...classificationNoteData])
    XLSX.utils.book_append_sheet(workbook, classificationNoteSheet, "特記事項")
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

export const validateNictDmpFull = (data: unknown): NictDmpFull => {
  return nictDmpFullSchema.parse(data)
}

export const isNictDmpFullValid = (data: unknown): boolean => {
  const result = nictDmpFullSchema.safeParse(data)
  return result.success
}

// === Helper functions for review status ===

export const requiresPdReview = (researchData: ResearchDataNict): boolean => {
  return researchData.pdReviewRequired
}

export const requiresBioethicsReview = (researchData: ResearchDataNict): boolean => {
  return researchData.bioethicsReviewRequired
}

export const hasClassificationNote = (researchData: ResearchDataNict): boolean => {
  return researchData.classificationNote !== null && researchData.classificationNote !== undefined
}

export const getResearchDataRequiringPdReview = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(requiresPdReview)
}

export const getResearchDataRequiringBioethicsReview = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(requiresBioethicsReview)
}

export const getResearchDataWithClassificationNote = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(hasClassificationNote)
}

// === Helper functions for access level ===

export const getResearchDataByAccessLevel = (
  nictDmpFull: NictDmpFull,
  level: typeof accessLevel[number],
): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(data => data.accessLevel === level)
}

export const getPublicResearchData = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return getResearchDataByAccessLevel(nictDmpFull, "公開")
}

export const getLimitedPublicResearchData = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return getResearchDataByAccessLevel(nictDmpFull, "限定公開")
}

export const getNonPublicResearchData = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return getResearchDataByAccessLevel(nictDmpFull, "非公開")
}

export const getUndecidedResearchData = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return getResearchDataByAccessLevel(nictDmpFull, "未定")
}

// === Helper functions for identifiers ===

export const hasIdentifier = (researchData: ResearchDataNict): boolean => {
  return !!researchData.identifier && researchData.identifier.trim() !== ""
}

export const getResearchDataWithIdentifier = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(hasIdentifier)
}

export const getResearchDataWithoutIdentifier = (nictDmpFull: NictDmpFull): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(data => !hasIdentifier(data))
}

// === Helper functions for data classification ===

export const getResearchDataByClassification = (
  nictDmpFull: NictDmpFull,
  classification: string,
): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(data => data.dataClassification === classification)
}

export const getUniqueClassifications = (nictDmpFull: NictDmpFull): string[] => {
  const classifications = nictDmpFull.researchData.map(data => data.dataClassification)
  return Array.from(new Set(classifications)).filter(c => c.trim() !== "")
}

// === Helper functions for storage location ===

export const getResearchDataByStorageLocation = (
  nictDmpFull: NictDmpFull,
  location: string,
): ResearchDataNict[] => {
  return nictDmpFull.researchData.filter(data => data.storageLocation === location)
}

export const getUniqueStorageLocations = (nictDmpFull: NictDmpFull): string[] => {
  const locations = nictDmpFull.researchData.map(data => data.storageLocation)
  return Array.from(new Set(locations)).filter(l => l.trim() !== "")
}

// === Statistics helpers ===

export const getResearchDataStatistics = (nictDmpFull: NictDmpFull) => {
  const total = nictDmpFull.researchData.length
  const byAccessLevel = {
    公開: getPublicResearchData(nictDmpFull).length,
    限定公開: getLimitedPublicResearchData(nictDmpFull).length,
    非公開: getNonPublicResearchData(nictDmpFull).length,
    未定: getUndecidedResearchData(nictDmpFull).length,
  }
  const withIdentifier = getResearchDataWithIdentifier(nictDmpFull).length
  const withClassificationNote = getResearchDataWithClassificationNote(nictDmpFull).length
  const requiresPdReview = getResearchDataRequiringPdReview(nictDmpFull).length
  const requiresBioethicsReview = getResearchDataRequiringBioethicsReview(nictDmpFull).length
  const uniqueClassifications = getUniqueClassifications(nictDmpFull)
  const uniqueStorageLocations = getUniqueStorageLocations(nictDmpFull)

  return {
    total,
    byAccessLevel,
    withIdentifier,
    withClassificationNote,
    requiresPdReview,
    requiresBioethicsReview,
    uniqueClassifications,
    classificationCount: uniqueClassifications.length,
    uniqueStorageLocations,
    storageLocationCount: uniqueStorageLocations.length,
  }
}

// === Review status helpers ===

export const getPendingReviews = (nictDmpFull: NictDmpFull) => {
  const pdReviewPending = nictDmpFull.researchData.filter(
    data => data.pdReviewRequired && (!data.pdReviewStatus || data.pdReviewStatus.trim() === ""),
  )
  const bioethicsReviewPending = nictDmpFull.researchData.filter(
    data => data.bioethicsReviewRequired && (!data.bioethicsReviewStatus || data.bioethicsReviewStatus.trim() === ""),
  )

  return {
    pdReviewPending,
    bioethicsReviewPending,
    hasPendingReviews: pdReviewPending.length > 0 || bioethicsReviewPending.length > 0,
  }
}

// === Data integrity helpers ===

export const validateDataIntegrity = (nictDmpFull: NictDmpFull): string[] => {
  const errors: string[] = []

  nictDmpFull.researchData.forEach(data => {
    // PD審議対象の場合、審査状況が必要
    if (data.pdReviewRequired && (!data.pdReviewStatus || data.pdReviewStatus.trim() === "")) {
      errors.push(`データNo.${data.dataNo}: PD審議対象のため、PD審査状況の記載が必要です`)
    }

    // 生体倫理審査対象の場合、審査状況が必要
    if (data.bioethicsReviewRequired && (!data.bioethicsReviewStatus || data.bioethicsReviewStatus.trim() === "")) {
      errors.push(`データNo.${data.dataNo}: 生体倫理審査対象のため、審査状況の記載が必要です`)
    }

    // 公開レベルが「限定公開」の場合、詳細が必要
    if (data.accessLevel === "限定公開" && (!data.accessLevelDetails || data.accessLevelDetails.trim() === "")) {
      errors.push(`データNo.${data.dataNo}: 限定公開のため、公開レベル詳細の記載が必要です`)
    }
  })

  return errors
}

export const isDataIntegrityValid = (nictDmpFull: NictDmpFull): boolean => {
  return validateDataIntegrity(nictDmpFull).length === 0
}
