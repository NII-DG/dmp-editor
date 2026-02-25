import * as XLSX from "xlsx"

import type { Dmp } from "@/dmp"
import { personRole } from "@/dmp"
import templateUrl from "@/templates/jsps_template.xlsx?url"

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

/** Cell origin constants for the DMP様式例 template sheet (1-indexed Excel rows) */
const TEMPLATE_CELLS = {
  dateCreated: "C5",
  dateModified: "C6",
  projectCode: "C9",
  /** Starting cell for person info rows (section 3) */
  personRowsOrigin: "A13",
  /** Starting cell for data info rows (section 4) */
  dataRowsOrigin: "A22",
} as const

/** Load the JSPS template as an ArrayBuffer via fetch */
async function fetchTemplateBuffer(): Promise<ArrayBuffer> {
  const res = await fetch(templateUrl)
  return res.arrayBuffer()
}

/**
 * Build a JSPS-format Excel workbook from the given template buffer and DMP data.
 * Writes DMP data into the "DMP様式例" sheet of the template workbook.
 */
export function buildJspsWorkbook(templateBuffer: ArrayBuffer, dmp: Dmp): Blob {
  const wb = XLSX.read(new Uint8Array(templateBuffer), { type: "array", cellStyles: true, cellDates: true })
  const ws = wb.Sheets["DMP様式例"]

  // Section 1: DMP creation/update dates
  ws[TEMPLATE_CELLS.dateCreated] = { t: "s", v: dmp.metadata.dateCreated }
  ws[TEMPLATE_CELLS.dateModified] = { t: "s", v: dmp.metadata.dateModified }

  // Section 2: project code
  ws[TEMPLATE_CELLS.projectCode] = { t: "s", v: dmp.projectInfo.projectCode }

  // Section 3: person info rows
  const personRows = buildPersonRows(dmp)
  XLSX.utils.sheet_add_aoa(ws, personRows, { origin: TEMPLATE_CELLS.personRowsOrigin })

  // Section 4: data info rows
  const dataRows = buildDataRows(dmp)
  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: TEMPLATE_CELLS.dataRowsOrigin })

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

/**
 * Export DMP as JSPS-format Excel using the bundled template.
 * Fetches the template xlsx, writes DMP data into the "DMP様式例" sheet,
 * and returns the result as a Blob.
 */
export async function exportToJspsExcel(dmp: Dmp): Promise<Blob> {
  const templateBuffer = await fetchTemplateBuffer()
  return buildJspsWorkbook(templateBuffer, dmp)
}
