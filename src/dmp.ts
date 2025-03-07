import * as XLSX from "xlsx"
import { z } from "zod"

// === Type definitions ===

export interface Dmp {
  metadata: DmpMetadata // DMP 作成・更新情報
  projectInfo: ProjectInfo // プロジェクト情報
  personInfo: PersonInfo[] // 担当者情報
  dataInfo: DataInfo[] // 研究データ情報
}

export type RevisionType = "新規" | "修正" | "更新"
export const revisionType = ["新規", "修正", "更新"] as const
export const revisionTypeSchema = z.enum(revisionType)

// DMP 作成・更新情報
export interface DmpMetadata {
  revisionType: RevisionType // 種別
  submissionDate: string // 提出日 YYYY-MM-DD
  dateCreated: string // DMP作成年月日 YYYY-MM-DD
  dateModified: string // DMP最終更新年月日 YYYY-MM-DD
}

export const dmpMetadataSchema = z.object({
  revisionType: z.enum(["新規", "修正", "更新"]),
  submissionDate: z.string(),
  dateCreated: z.string(),
  dateModified: z.string(),
})

// プロジェクト情報
export interface ProjectInfo {
  fundingAgency: string // 資金配分機関情報
  programName?: string | null// プログラム名(事業名・種目名)
  // NISTEP 体系的番号一覧 (https://www.nistep.go.jp/taikei) に掲載されている「事業・制度名」を記載
  programCode?: string | null // 体系的番号におけるプログラム情報コード
  // NISTEP 体系的番号一覧 (https://www.nistep.go.jp/taikei) に掲載されている「機関コード」および「施策・事業の特定コード」を表すコードを記載
  projectCode: string // 体系的番号 (15桁)
  projectName: string // プロジェクト名
  adoptionYear?: string | null // 採択年度
  startYear?: string | null // 事業開始年度
  endYear?: string | null // 事業終了年度
}

export const projectInfoSchema = z.object({
  fundingAgency: z.string(),
  programName: z.string().nullable().optional(),
  programCode: z.string().nullable().optional(),
  projectCode: z.string(),
  projectName: z.string(),
  adoptionYear: z.string().nullable().optional(),
  startYear: z.string().nullable().optional(),
  endYear: z.string().nullable().optional(),
})

export type PersonRole = "研究代表者" | "研究分担者" | "管理対象データの作成者" | "管理対象データの管理責任者"
export const personRole = ["研究代表者", "研究分担者", "管理対象データの作成者", "管理対象データの管理責任者"] as const
export const personRoleSchema = z.enum(personRole)

// 担当者情報
export interface PersonInfo {
  role: PersonRole[] // no header
  lastName: string // 性
  firstName: string // 名
  eRadResearcherId?: string | null // e-Rad研究者番号
  orcid?: string | null // ORCID
  affiliation: string // 所属機関
}

export const personInfoSchema = z.object({
  role: z.array(z.enum(personRole)),
  lastName: z.string(),
  firstName: z.string(),
  eRadResearcherId: z.string().nullable().optional(),
  orcid: z.string().nullable().optional(),
  affiliation: z.string(),
})

export type ResearchField = "ライフサイエンス" | "情報通信" | "環境" | "ナノテク・材料" | "エネルギー" | "ものづくり技術" | "社会基盤" | "フロンティア" | "人文・社会" | "自然科学一般" | "その他"
export const researchField = ["ライフサイエンス", "情報通信", "環境", "ナノテク・材料", "エネルギー", "ものづくり技術", "社会基盤", "フロンティア", "人文・社会", "自然科学一般", "その他"] as const
export const researchFieldSchema = z.enum(researchField)

export type DataType = "データセット" | "集計データ" | "臨床試験データ" | "編集データ" | "符号化データ" | "実験データ" | "ゲノムデータ" | "地理空間データ" | "実験ノート" | "測定・評価データ" | "観測データ" | "記録データ" | "シミュレーションデータ" | "調査データ"
export const dataType = ["データセット", "集計データ", "臨床試験データ", "編集データ", "符号化データ", "実験データ", "ゲノムデータ", "地理空間データ", "実験ノート", "測定・評価データ", "観測データ", "記録データ", "シミュレーションデータ", "調査データ"] as const
export const dataTypeSchema = z.enum(dataType)

export type AccessRights = "公開" | "共有" | "非共有・非公開" | "公開期間猶予"
export const accessRights = ["公開", "共有", "非共有・非公開", "公開期間猶予"] as const
export const accessRightsSchema = z.enum(accessRights)

// 研究データ情報
export interface DataInfo {
  dataName: string // 管理対象データの名称
  publicationDate: string // 掲載日・掲載更新日
  description: string // データの説明
  acquisitionMethod?: string | null // 管理対象データの取得または収集方法
  researchField: ResearchField // データの分野
  dataType: DataType // データ種別
  dataSize?: string | null // 概略データ量
  reuseInformation?: string | null // 再利用を可能にするための情報
  hasSensitiveData?: boolean | null // 機微情報の有無: 有 | 無
  sensitiveDataPolicy?: string | null // 機微情報がある場合の取扱い方針
  usagePolicy: string // 管理対象データの利活用・提供方針 (研究活動時)
  repositoryInformation: string // リポジトリ情報 (研究活動時)
  backupLocation?: string | null // 管理対象データのバックアップ場所 (研究活動時)
  publicationPolicy?: string | null // 管理対象データの公開・提供方針詳細
  accessRights: AccessRights // アクセス権
  plannedPublicationDate: string // 管理対象データの公開予定日 YYYY-MM-DD
  repository: string // リポジトリ情報 (リポジトリ URL・DOIリンク) (研究活動後)
  dataCreator?: number | null // 管理対象データの作成者
  dataManagementAgency: string // データ管理機関
  rorId?: string | null // データ管理機関コード (ROR ID)
  dataManager: string // データ管理者 (部署名等)
  dataManagerContact: string // データ管理者の連絡先
  dataStorageLocation?: string | null // 研究データの保存場所 (研究事業終了後)
  dataStoragePeriod?: string | null // 研究データの保存期間 (研究事業終了後)
}

export const dataInfoSchema = z.object({
  dataName: z.string(),
  publicationDate: z.string(),
  description: z.string(),
  acquisitionMethod: z.string().nullable().optional(),
  researchField: z.enum(researchField),
  dataType: z.enum(dataType),
  dataSize: z.string().nullable().optional(),
  reuseInformation: z.string().nullable().optional(),
  hasSensitiveData: z.boolean().nullable().optional(),
  sensitiveDataPolicy: z.string().nullable().optional(),
  usagePolicy: z.string(),
  repositoryInformation: z.string(),
  backupLocation: z.string().nullable().optional(),
  publicationPolicy: z.string().nullable().optional(),
  accessRights: z.enum(accessRights),
  plannedPublicationDate: z.string(),
  repository: z.string(),
  dataCreator: z.number().nullable().optional(),
  dataManagementAgency: z.string(),
  rorId: z.string().nullable().optional(),
  dataManager: z.string(),
  dataManagerContact: z.string(),
  dataStorageLocation: z.string().nullable().optional(),
  dataStoragePeriod: z.string().nullable().optional(),
})

export const dmpSchema = z.object({
  metadata: dmpMetadataSchema,
  projectInfo: projectInfoSchema,
  personInfo: z.array(personInfoSchema),
  dataInfo: z.array(dataInfoSchema),
})

// === Initial values ===

export const initDmp = (): Dmp => {
  return {
    metadata: {
      revisionType: "新規",
      submissionDate: todayString(),
      dateCreated: todayString(),
      dateModified: todayString(),
    },
    projectInfo: {
      fundingAgency: "",
      programName: undefined,
      programCode: undefined,
      projectCode: "",
      projectName: "",
      adoptionYear: undefined,
      startYear: undefined,
      endYear: undefined,
    },
    personInfo: [],
    dataInfo: [],
  }
}

export const initPersonInfo = (): PersonInfo => {
  return {
    role: [],
    lastName: "",
    firstName: "",
    eRadResearcherId: undefined,
    orcid: undefined,
    affiliation: "",
  }
}

export const initDataInfo = (): DataInfo => {
  return {
    dataName: "",
    publicationDate: "",
    description: "",
    acquisitionMethod: undefined,
    researchField: "ライフサイエンス",
    dataType: "データセット",
    dataSize: undefined,
    reuseInformation: undefined,
    hasSensitiveData: undefined,
    sensitiveDataPolicy: undefined,
    usagePolicy: "",
    repositoryInformation: "",
    backupLocation: undefined,
    publicationPolicy: undefined,
    accessRights: "公開",
    plannedPublicationDate: "",
    repository: "",
    dataCreator: undefined,
    dataManagementAgency: "",
    rorId: undefined,
    dataManager: "",
    dataManagerContact: "",
    dataStorageLocation: undefined,
    dataStoragePeriod: undefined,
  }
}

// === Generate Excel Data ===

export const exportToExcel = (dmp: Dmp): Blob => {
  const workbook = XLSX.utils.book_new()

  // DMP 作成・更新情報
  const dmpMetadata = [
    ["種別", dmp.metadata.revisionType],
    ["提出日", dmp.metadata.submissionDate],
    ["DMP 作成年月日", dmp.metadata.dateCreated],
    ["DMP 最終更新年月日", dmp.metadata.dateModified],
  ]
  const dmpMetadataSheet = XLSX.utils.aoa_to_sheet(dmpMetadata)
  XLSX.utils.book_append_sheet(workbook, dmpMetadataSheet, "DMP 作成・更新情報")

  // DMP 作成・更新情報
  const projectInfo = [
    ["資金配分機関情報", dmp.projectInfo.fundingAgency],
    ["プログラム名", dmp.projectInfo.programName ?? ""],
    ["体系的番号におけるプログラム情報コード", dmp.projectInfo.programCode ?? ""],
    ["採択年度", dmp.projectInfo.adoptionYear ?? ""],
    ["事業開始年度", dmp.projectInfo.startYear ?? ""],
    ["事業終了年度", dmp.projectInfo.endYear ?? ""],
    ["体系的番号", dmp.projectInfo.projectCode],
    ["プロジェクト名", dmp.projectInfo.projectName],
  ]
  const projectInfoSheet = XLSX.utils.aoa_to_sheet(projectInfo)
  XLSX.utils.book_append_sheet(workbook, projectInfoSheet, "プロジェクト情報")

  // 担当者情報
  const personInfoHeader = ["", "本計画書内通し番号", "姓", "名", "e-Rad 研究者番号", "ORCID", "所属機関"]
  const personInfoData = []
  for (const role of personRole) {
    for (const person of dmp.personInfo) {
      if (person.role.includes(role)) {
        personInfoData.push([
          role,
          "", // Add index after
          person.lastName,
          person.firstName,
          person.eRadResearcherId ?? "",
          person.orcid ?? "",
          person.affiliation,
        ])
      }
    }
  }
  const personNames = listingPersonNames(dmp)
  for (const row of personInfoData) {
    const name = `${row[2]} ${row[3]}`.trim()
    const index = personNames.indexOf(name) + 1
    row[1] = `${index}`
  }
  const personInfoSheet = XLSX.utils.aoa_to_sheet([personInfoHeader, ...personInfoData])
  XLSX.utils.book_append_sheet(workbook, personInfoSheet, "担当者情報")

  // 研究データ情報
  const dataInfoHeader = [
    "データ No.",
    "管理対象データの名称",
    "掲載日・掲載更新日",
    "データの説明",
    "管理対象データの取得または収集方法",
    "データの分野",
    "データ種別",
    "概略データ量",
    "再利用を可能にするための情報",
    "機微情報の有無",
    "機微情報がある場合の取扱い方針",
    "管理対象データの利活用・提供方針 (研究活動時)",
    "リポジトリ情報 (研究活動時)",
    "管理対象データのバックアップ場所 (研究活動時)",
    "管理対象データの公開・提供方針詳細",
    "アクセス権",
    "管理対象データの公開予定日",
    "リポジトリ情報 (リポジトリ URL・DOIリンク) (研究活動後)",
    "管理対象データの作成者",
    "データ管理機関",
    "データ管理機関コード (ROR ID)",
    "データ管理者 (部署名等)",
    "データ管理者の連絡先",
    "研究データの保存場所 (研究事業終了後)",
    "研究データの保存期間 (研究事業終了後)",
  ]
  const dataInfoData = dmp.dataInfo.map((data, index) => [
    index + 1,
    data.dataName,
    data.publicationDate,
    data.description,
    data.acquisitionMethod ?? "",
    data.researchField,
    data.dataType,
    data.dataSize ?? "",
    data.reuseInformation ?? "",
    (data.hasSensitiveData === undefined || data.hasSensitiveData === null) ? "" : data.hasSensitiveData ? "有" : "無",
    data.sensitiveDataPolicy ?? "",
    data.usagePolicy,
    data.repositoryInformation,
    data.backupLocation ?? "",
    data.publicationPolicy ?? "",
    data.accessRights,
    data.plannedPublicationDate,
    data.repository,
    data.dataCreator ?? "",
    data.dataManagementAgency,
    data.rorId ?? "",
    data.dataManager,
    data.dataManagerContact,
    data.dataStorageLocation ?? "",
    data.dataStoragePeriod ?? "",
  ])
  const dataInfoSheet = XLSX.utils.aoa_to_sheet([dataInfoHeader, ...dataInfoData])
  XLSX.utils.book_append_sheet(workbook, dataInfoSheet, "研究データ情報")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

// === Utility functions ===

export const listingPersonNames = (dmp: Dmp): string[] => {
  return dmp.personInfo.map(person => `${person.lastName} ${person.firstName}`.trim())
}

export const todayString = (): string => {
  // YYYY-MM-DD
  return new Date().toISOString().split("T")[0]
}
