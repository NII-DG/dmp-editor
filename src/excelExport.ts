import type { Dmp } from "@/dmp"
import { personRole, listingPersonNames } from "@/dmp"

/**
 * Export DMP as a sample Excel file (.xlsx).
 *
 * The xlsx library is loaded via dynamic import so that it is excluded from
 * the initial bundle and only downloaded when the user triggers an export.
 */
export const exportToExcel = async (dmp: Dmp): Promise<Blob> => {
  const XLSX = await import("xlsx")

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

  // プロジェクト情報
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
  const personInfoHeader = ["", "本計画書内通し番号", "姓", "名", "e-Rad 研究者番号", "ORCID", "所属機関", "連絡先"]
  const personInfoData: (string | number)[][] = []
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
          person.contact ?? "",
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
    data.publicationDate ?? "",
    data.description,
    data.acquisitionMethod ?? "",
    data.researchField,
    data.dataType,
    data.dataSize ?? "",
    data.reuseInformation ?? "",
    data.hasSensitiveData ?? "",
    data.sensitiveDataPolicy ?? "",
    data.usagePolicy,
    data.repositoryInformation,
    data.backupLocation ?? "",
    data.publicationPolicy ?? "",
    data.accessRights,
    data.plannedPublicationDate ?? "",
    data.repository ?? "",
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
