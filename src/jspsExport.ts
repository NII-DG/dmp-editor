import * as XLSX from "xlsx"

import type { Dmp } from "@/dmp"
import { personRole } from "@/dmp"

/** Circled number characters ①–⑳ */
const CIRCLED_NUMBERS = [
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
  "⑪",
  "⑫",
  "⑬",
  "⑭",
  "⑮",
  "⑯",
  "⑰",
  "⑱",
  "⑲",
  "⑳",
]

/** Convert 1-based index to circled number string */
export function toCircledNumber(n: number): string {
  return CIRCLED_NUMBERS[n - 1] ?? String(n)
}

/** Mapping from DMP personRole to JSPS role label */
const JSPS_ROLE_LABELS: Record<string, string> = {
  "研究代表者": "研究代表者",
  "研究分担者": "研究分担者",
  "管理対象データの作成者": "研究データの取得者又は収集者",
  "管理対象データの管理責任者": "研究開発データの管理責任者",
}

/**
 * Build person info rows for section 3.
 * Rows are grouped by JSPS role order. Within each role, persons are listed
 * in the order they appear in dmp.personInfo (= their serial number order).
 * If no person matches a role, one empty placeholder row is generated.
 */
export function buildPersonRows(dmp: Dmp): (string | number)[][] {
  const rows: (string | number)[][] = []

  for (const role of personRole) {
    const jspsLabel = JSPS_ROLE_LABELS[role] ?? role
    const matched = dmp.personInfo
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.role.includes(role))

    if (matched.length === 0) {
      rows.push(["", jspsLabel, "", "", "", "", "", ""])
    } else {
      for (const { person, index } of matched) {
        rows.push([
          "",
          jspsLabel,
          toCircledNumber(index + 1),
          `${person.lastName} ${person.firstName}`.trim(),
          person.affiliation,
          "",
          person.eRadResearcherId ?? "",
          person.contact ?? "",
        ])
      }
    }
  }

  return rows
}

/**
 * Build data info rows for section 4.
 * Each DataInfo entry is mapped to a row in column order:
 * No. | dataName | description | dataCreator(circled) | dataManager |
 * sensitiveDataPolicy | accessRights | publicationPolicy | repository | plannedPublicationDate
 */
export function buildDataRows(dmp: Dmp): (string | number)[][] {
  return dmp.dataInfo.map((data, index) => {
    const creatorRef =
      typeof data.dataCreator === "number" ? toCircledNumber(data.dataCreator) : ""
    return [
      index + 1,
      data.dataName,
      data.description,
      creatorRef,
      data.dataManager,
      data.sensitiveDataPolicy ?? "",
      data.accessRights,
      data.publicationPolicy ?? "",
      data.repository ?? "",
      data.plannedPublicationDate ?? "",
    ]
  })
}

/** Export DMP as JSPS-format Excel (single sheet: DMP様式例) */
export function exportToJspsExcel(dmp: Dmp): Blob {
  const empty: string[] = Array(14).fill("")

  const aoa: (string | number)[][] = [
    // Row 1: title
    ["科学研究費助成事業データマネジメントプラン（DMP）様式例", ...empty],
    // Row 2: note 1
    ["", "", "※研究の進捗に応じ、個別の研究データごとの記述を追記・更新すること※", ...empty],
    // Row 3: note 2
    ["", "", "※本様式例の項目の内容に沿っていれば、本様式以外を用いても差し支えない※", ...empty],
    // Row 4: section 1 header
    ["1. DMP作成・更新情報", ...empty],
    // Row 5: dateCreated (C column = index 2)
    ["", "DMP作成年月日", dmp.metadata.dateCreated, ...empty],
    // Row 6: dateModified
    ["", "DMP最終更新年月日", dmp.metadata.dateModified, ...empty],
    // Row 7: empty
    [...empty],
    // Row 8: section 2 header
    ["2. 研究課題情報", ...empty],
    // Row 9: projectCode
    ["", "研究課題番号", dmp.projectInfo.projectCode, ...empty],
    // Row 10: empty
    [...empty],
    // Row 11: section 3 header
    ["3. 担当者情報", ...empty],
    // Row 12: section 3 column headers
    [
      "",
      "",
      "本計画書内通し番号",
      "氏名",
      "所属・役職",
      "",
      "研究者番号\n※該当がない場合は空欄可",
      "連絡先",
      ...empty,
    ],
    // Person rows (section 3)
    ...buildPersonRows(dmp),
    // Empty row before section 4
    [...empty],
    // Section 4 header
    ["4. 研究データ情報", ...empty],
    // Section 4 column headers
    [
      "No.",
      "研究データの名称",
      "研究データの概要",
      "研究データの取得者又は収集者",
      "研究データの管理者\n※取得者又は収集者と異なる場合のみ記入",
      "機微情報がある場合の取り扱い方針",
      "研究データの公開・提供方針",
      "研究データの公開・提供方針詳細",
      "研究データの公開・提供場所\n（URL、DOI）",
      "研究データ公開日（予定日）",
      ...empty,
    ],
    // Data rows (section 4)
    ...buildDataRows(dmp),
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "DMP様式例")

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
