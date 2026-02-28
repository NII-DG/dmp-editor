import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate"

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

// ---------------------------------------------------------------------------
// Sheet XML path for "DMP様式例" (sheet1 in the template)
// ---------------------------------------------------------------------------
const DMP_SHEET_PATH = "xl/worksheets/sheet1.xml"

// Template row constants for section 3 (person info)
const PERSON_ROW_START = 13
const PERSON_ROW_COUNT = 6 // rows 13–18 in template

// Template row constants for section 4 (data info)
const DATA_ROW_START = 22
const DATA_ROW_COUNT = 5 // rows 22–26 in template

// Row number where overflow rows (beyond template capacity) start.
// The template occupies rows 1–39, so overflow begins at 40.
const OVERFLOW_ROW_START = 40

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** Escape XML special characters for use in element text content. */
function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Convert a 0-based column index to an Excel column letter (A, B, …, Z, AA, …).
 */
function colLetter(colIdx: number): string {
  let result = ""
  let n = colIdx
  do {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}

/**
 * Set a single cell value in raw OOXML sheet XML.
 *
 * Finds the existing <c r="ref" …> element and replaces its content with the
 * supplied value while preserving the s (style) attribute and all other
 * non-type attributes.  Uses inline strings (t="inlineStr") for text values
 * so that the shared-strings table does not need to be touched.
 *
 * If the cell does not exist in the XML the function is a no-op.
 */
function setCellInXml(
  xml: string,
  ref: string,
  value: string | number | null | undefined,
): string {
  // Matches both self-closing (<c r="REF" …/>) and content forms
  // (<c r="REF" …>[content]</c>).
  // Group 1 captures attribute text between r="REF" and the closing />
  // or the opening > of the content form.
  // [^/>] | /(?!>) ensures we don't consume the /> terminator.
  const re = new RegExp(
    `<c r="${ref}"((?:[^/>]|/(?!>))*?)\\s*(?:/>|>[\\s\\S]*?</c>)`,
  )

  return xml.replace(re, (_match, rawAttrs: string) => {
    // Strip any pre-existing t= attribute (we'll add the correct one below).
    const attrs = rawAttrs.replace(/\s+t="[^"]*"/g, "")

    if (value === null || value === undefined || value === "") {
      return `<c r="${ref}"${attrs}/>`
    }
    if (typeof value === "number") {
      return `<c r="${ref}"${attrs}><v>${value}</v></c>`
    }
    return `<c r="${ref}"${attrs} t="inlineStr"><is><t>${escXml(String(value))}</t></is></c>`
  })
}

/**
 * Build a bare <row> XML element with no style information.
 * Used for overflow rows that extend beyond the template's pre-styled area.
 */
function buildRowXml(rowNum: number, values: (string | number | null | undefined)[]): string {
  const cells = values
    .map((val, j) => {
      const ref = `${colLetter(j)}${rowNum}`
      if (val === null || val === undefined || val === "") {
        return `<c r="${ref}"/>`
      }
      if (typeof val === "number") {
        return `<c r="${ref}"><v>${val}</v></c>`
      }
      return `<c r="${ref}" t="inlineStr"><is><t>${escXml(String(val))}</t></is></c>`
    })
    .join("")
  return `<row r="${rowNum}">${cells}</row>`
}

/**
 * Append a <row> element into sheetData just before </sheetData>.
 */
function appendRowXml(sheetXml: string, rowXml: string): string {
  return sheetXml.replace("</sheetData>", `${rowXml}</sheetData>`)
}

/**
 * Update the <dimension> element to extend the sheet range to the given last
 * row number.  Excel uses the dimension to determine which rows to read, so
 * overflow rows will be invisible without this update.
 */
function updateDimension(sheetXml: string, lastRow: number): string {
  return sheetXml.replace(
    /<dimension ref="([A-Z]+\d+):([A-Z]+)\d+"\/>/,
    (_, start, endCol) => `<dimension ref="${start}:${endCol}${lastRow}"/>`,
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Load the JSPS template as an ArrayBuffer via fetch */
async function fetchTemplateBuffer(): Promise<ArrayBuffer> {
  const res = await fetch(templateUrl)
  return res.arrayBuffer()
}

/**
 * Build a JSPS-format Excel workbook by patching the template at the zip/XML
 * level.  Only the target sheet's XML is modified; every other file in the
 * archive (drawings, images, data-validation lists, comments, styles, …) is
 * left byte-for-byte identical to the original template.
 */
export function buildJspsWorkbook(templateBuffer: ArrayBuffer, dmp: Dmp): Blob {
  const zip = unzipSync(new Uint8Array(templateBuffer))
  let sheetXml = strFromU8(zip[DMP_SHEET_PATH])

  // Section 1-2: DMP metadata and project code
  sheetXml = setCellInXml(sheetXml, "C5", dmp.metadata.dateCreated)
  sheetXml = setCellInXml(sheetXml, "C6", dmp.metadata.dateModified)
  sheetXml = setCellInXml(sheetXml, "C9", dmp.projectInfo.projectCode)

  // Section 3: person info — write into template rows 13–18 (up to 6 rows)
  const personRows = buildPersonRows(dmp)
  for (let i = 0; i < Math.min(personRows.length, PERSON_ROW_COUNT); i++) {
    const rowNum = PERSON_ROW_START + i
    for (let j = 0; j < personRows[i].length; j++) {
      sheetXml = setCellInXml(sheetXml, `${colLetter(j)}${rowNum}`, personRows[i][j])
    }
  }

  // Section 4: data info — write into template rows 22–26 (up to 5 rows)
  const dataRows = buildDataRows(dmp)
  for (let i = 0; i < Math.min(dataRows.length, DATA_ROW_COUNT); i++) {
    const rowNum = DATA_ROW_START + i
    for (let j = 0; j < dataRows[i].length; j++) {
      sheetXml = setCellInXml(sheetXml, `${colLetter(j)}${rowNum}`, dataRows[i][j])
    }
  }

  // Overflow rows (beyond template capacity) — appended after the last
  // template row (39) to avoid conflicting with existing row numbers.
  let nextOverflowRow = OVERFLOW_ROW_START
  for (let i = PERSON_ROW_COUNT; i < personRows.length; i++) {
    sheetXml = appendRowXml(sheetXml, buildRowXml(nextOverflowRow++, personRows[i]))
  }
  for (let i = DATA_ROW_COUNT; i < dataRows.length; i++) {
    sheetXml = appendRowXml(sheetXml, buildRowXml(nextOverflowRow++, dataRows[i]))
  }

  // If overflow rows were added, extend the sheet dimension so Excel (and
  // XLSX parsers) can read those rows.
  const lastWrittenRow = nextOverflowRow - 1
  if (lastWrittenRow >= OVERFLOW_ROW_START) {
    sheetXml = updateDimension(sheetXml, lastWrittenRow)
  }

  // Wrap in native Uint8Array to avoid cross-realm issues in environments
  // where fflate's strToU8 returns a Uint8Array from a different realm
  // (instanceof Uint8Array === false), causing zipSync to mishandle it.
  const modifiedZip = { ...zip, [DMP_SHEET_PATH]: new Uint8Array(strToU8(sheetXml)) }
  const outputBytes = zipSync(modifiedZip)
  // Use .buffer (ArrayBuffer) rather than the Uint8Array directly so that
  // FileReader.readAsArrayBuffer works correctly in all environments.
  return new Blob([outputBytes.buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

/**
 * Export DMP as JSPS-format Excel using the bundled template.
 * Fetches the template xlsx and returns the patched workbook as a Blob.
 */
export async function exportToJspsExcel(dmp: Dmp): Promise<Blob> {
  const templateBuffer = await fetchTemplateBuffer()
  return buildJspsWorkbook(templateBuffer, dmp)
}
