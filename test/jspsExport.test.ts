import * as fs from "fs"
import * as path from "path"
import { describe, it, expect } from "vitest"
import * as XLSX from "xlsx"

import type { Dmp } from "../src/dmp"
import { initDmp, initDataInfo, initPersonInfo } from "../src/dmp"
import { exportToJspsExcel, buildJspsWorkbook, toCircledNumber, buildPersonRows, buildDataRows } from "../src/jspsExport"

const TEMPLATE_PATH = path.resolve(__dirname, "../src/templates/jsps_template.xlsx")

/** Return a fresh ArrayBuffer of the template file on each call. */
function readTemplateBuffer(): ArrayBuffer {
  const buf = fs.readFileSync(TEMPLATE_PATH)
  // Use Uint8Array to ensure compatibility with XLSX.read in jsdom environment
  return new Uint8Array(buf).buffer
}

// Helper: read Blob as ArrayBuffer using FileReader (jsdom-compatible)
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

// Helper: parse Blob to sheet rows
async function parseSheet(blob: Blob): Promise<string[][]> {
  const buffer = await blobToArrayBuffer(blob)
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets["DMP様式例"]
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" })
}

// Helper: build a minimal DMP with one person
function makeDmpWithPerson(overrides: Partial<ReturnType<typeof initPersonInfo>> = {}): Dmp {
  const dmp = initDmp()
  dmp.personInfo = [{ ...initPersonInfo(), ...overrides }]
  return dmp
}

describe("toCircledNumber", () => {
  it("converts 1 to ①", () => {
    expect(toCircledNumber(1)).toBe("①")
  })

  it("converts 10 to ⑩", () => {
    expect(toCircledNumber(10)).toBe("⑩")
  })

  it("converts 20 to ⑳", () => {
    expect(toCircledNumber(20)).toBe("⑳")
  })

  it("returns string number for values above 20", () => {
    expect(toCircledNumber(21)).toBe("21")
    expect(toCircledNumber(99)).toBe("99")
  })
})

describe("buildPersonRows", () => {
  it("outputs 研究代表者 role label for person with role 研究代表者", () => {
    const dmp = makeDmpWithPerson({ role: ["研究代表者"], lastName: "山田", firstName: "太郎", affiliation: "大学" })
    const rows = buildPersonRows(dmp)
    const row = rows.find((r) => r[1] === "研究代表者")
    expect(row).toBeDefined()
  })

  it("converts 管理対象データの作成者 to 研究データの取得者又は収集者", () => {
    const dmp = makeDmpWithPerson({ role: ["管理対象データの作成者"], lastName: "鈴木", firstName: "花子", affiliation: "研究所" })
    const rows = buildPersonRows(dmp)
    const row = rows.find((r) => r[1] === "研究データの取得者又は収集者")
    expect(row).toBeDefined()
  })

  it("converts 管理対象データの管理責任者 to 研究開発データの管理責任者", () => {
    const dmp = makeDmpWithPerson({ role: ["管理対象データの管理責任者"], lastName: "田中", firstName: "一郎", affiliation: "大学院" })
    const rows = buildPersonRows(dmp)
    const row = rows.find((r) => r[1] === "研究開発データの管理責任者")
    expect(row).toBeDefined()
  })

  it("assigns serial numbers ①②③ in personInfo array index order", () => {
    const dmp = initDmp()
    dmp.personInfo = [
      { ...initPersonInfo(), role: ["研究代表者"], lastName: "A", firstName: "1", affiliation: "" },
      { ...initPersonInfo(), role: ["研究代表者"], lastName: "B", firstName: "2", affiliation: "" },
      { ...initPersonInfo(), role: ["研究代表者"], lastName: "C", firstName: "3", affiliation: "" },
    ]
    const rows = buildPersonRows(dmp)
    const repRows = rows.filter((r) => r[1] === "研究代表者")
    expect(repRows[0][2]).toBe("①")
    expect(repRows[1][2]).toBe("②")
    expect(repRows[2][2]).toBe("③")
  })

  it("outputs one person in multiple rows when they have multiple roles", () => {
    const dmp = makeDmpWithPerson({
      role: ["研究代表者", "管理対象データの管理責任者"],
      lastName: "複数",
      firstName: "役割",
      affiliation: "機関",
    })
    const rows = buildPersonRows(dmp)
    const repRow = rows.find((r) => r[1] === "研究代表者")
    const mgrRow = rows.find((r) => r[1] === "研究開発データの管理責任者")
    expect(repRow).toBeDefined()
    expect(mgrRow).toBeDefined()
    // Both rows reference same person (serial number ①)
    expect(repRow![2]).toBe("①")
    expect(mgrRow![2]).toBe("①")
  })

  it("outputs contact in column index 7 (H)", () => {
    const dmp = makeDmpWithPerson({
      role: ["研究代表者"],
      lastName: "連絡",
      firstName: "先",
      affiliation: "大学",
      contact: "test@example.com",
    })
    const rows = buildPersonRows(dmp)
    const row = rows.find((r) => r[1] === "研究代表者")
    expect(row).toBeDefined()
    expect(row![7]).toBe("test@example.com")
  })

  it("generates one empty row for a role with no matching persons", () => {
    const dmp = initDmp()
    dmp.personInfo = [] // no persons
    const rows = buildPersonRows(dmp)
    // Each of the 4 roles should produce 1 empty placeholder row
    expect(rows.length).toBe(4)
  })
})

describe("buildDataRows", () => {
  it("converts numeric dataCreator to circled number", () => {
    const dmp = initDmp()
    const data = { ...initDataInfo(), dataName: "テストデータ", dataCreator: 2 }
    dmp.dataInfo = [data]
    const rows = buildDataRows(dmp)
    expect(rows[0][3]).toBe("②")
  })

  it("outputs empty string for null/undefined dataCreator", () => {
    const dmp = initDmp()
    const dataNullCreator = { ...initDataInfo(), dataName: "データ1", dataCreator: null }
    const dataUndefinedCreator = { ...initDataInfo(), dataName: "データ2", dataCreator: undefined }
    dmp.dataInfo = [dataNullCreator, dataUndefinedCreator]
    const rows = buildDataRows(dmp)
    expect(rows[0][3]).toBe("")
    expect(rows[1][3]).toBe("")
  })

  it("outputs all fields in correct column order", () => {
    const dmp = initDmp()
    const data = {
      ...initDataInfo(),
      dataName: "名称",
      description: "概要",
      dataCreator: 1,
      dataManager: "管理者",
      sensitiveDataPolicy: "匿名化",
      accessRights: "公開",
      publicationPolicy: "公開方針詳細",
      repository: "https://repo.example.com",
      plannedPublicationDate: "2025-03-31",
    }
    dmp.dataInfo = [data]
    const rows = buildDataRows(dmp)
    const row = rows[0]
    expect(row[0]).toBe(1) // No.
    expect(row[1]).toBe("名称") // dataName
    expect(row[2]).toBe("概要") // description
    expect(row[3]).toBe("①") // dataCreator
    expect(row[4]).toBe("管理者") // dataManager
    expect(row[5]).toBe("匿名化") // sensitiveDataPolicy
    expect(row[6]).toBe("公開") // accessRights
    expect(row[7]).toBe("公開方針詳細") // publicationPolicy
    expect(row[8]).toBe("https://repo.example.com") // repository
    expect(row[9]).toBe("2025-03-31") // plannedPublicationDate
  })
})

describe("buildJspsWorkbook", () => {
  it("returns a Blob", () => {
    const dmp = initDmp()
    const blob = buildJspsWorkbook(readTemplateBuffer(), dmp)
    expect(blob).toBeInstanceOf(Blob)
  })

  it("Blob has xlsx MIME type", () => {
    const dmp = initDmp()
    const blob = buildJspsWorkbook(readTemplateBuffer(), dmp)
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  })

  it("sheet name is DMP様式例", async () => {
    const dmp = initDmp()
    const blob = buildJspsWorkbook(readTemplateBuffer(), dmp)
    const buffer = await blobToArrayBuffer(blob)
    const wb = XLSX.read(buffer, { type: "array" })
    expect(wb.SheetNames).toContain("DMP様式例")
  })

  it("section 1: dateCreated and dateModified appear in correct rows", async () => {
    const dmp = initDmp()
    dmp.metadata.dateCreated = "2024-01-01"
    dmp.metadata.dateModified = "2024-06-01"
    const rows = await parseSheet(buildJspsWorkbook(readTemplateBuffer(), dmp))
    // Row index 4 (0-based) = line 5 = DMP作成年月日
    expect(rows[4][2]).toBe("2024-01-01")
    // Row index 5 (0-based) = line 6 = DMP最終更新年月日
    expect(rows[5][2]).toBe("2024-06-01")
  })

  it("section 2: projectCode appears in correct row", async () => {
    const dmp = initDmp()
    dmp.projectInfo.projectCode = "JP12345678"
    const rows = await parseSheet(buildJspsWorkbook(readTemplateBuffer(), dmp))
    // Row index 8 (0-based) = line 9 = 研究課題番号
    expect(rows[8][2]).toBe("JP12345678")
  })

  it("outputs all rows when dataInfo exceeds 5 entries", async () => {
    const dmp = initDmp()
    dmp.dataInfo = Array.from({ length: 8 }, (_, i) => ({
      ...initDataInfo(),
      dataName: `データ${i + 1}`,
    }))
    const rows = await parseSheet(buildJspsWorkbook(readTemplateBuffer(), dmp))
    const dataNames = rows.map((r) => r[1]).filter((v) => String(v).startsWith("データ"))
    expect(dataNames.length).toBe(8)
  })

  it("inserts person overflow rows within section 3 (not at row 40+) (Bug 2)", async () => {
    // 4 研究代表者 + 3 placeholder rows for other roles = 7 total person rows
    // Template has 6 person rows (rows 13-18), so 1 row overflows
    const dmp = initDmp()
    dmp.personInfo = Array.from({ length: 4 }, (_, i) => ({
      ...initPersonInfo(),
      role: ["研究代表者"] as ["研究代表者"],
      lastName: `Person${i + 1}`,
      firstName: "",
    }))

    const rows = await parseSheet(buildJspsWorkbook(readTemplateBuffer(), dmp))

    // All 4 named persons should appear before Excel row 40 (index 39)
    const personNamesBeforeOverflow = rows
      .slice(0, 39)
      .map((r) => String(r[3] ?? ""))
      .filter((name) => name.startsWith("Person"))
    expect(personNamesBeforeOverflow.length).toBe(4)

    // Excel row 40 (index 39) should NOT contain any person name
    const row40 = rows[39] ?? []
    expect(String(row40[3] ?? "")).not.toMatch(/^Person/)
  })

  it("inserts data overflow rows within section 4 (not at row 40+) (Bug 3)", async () => {
    // 0 person overflow (4 placeholder rows ≤ 6 template rows)
    // 8 data rows → 3 overflow rows inserted within section 4
    const dmp = initDmp()
    dmp.personInfo = [] // 4 placeholder rows, all within template capacity
    dmp.dataInfo = Array.from({ length: 8 }, (_, i) => ({
      ...initDataInfo(),
      dataName: `DataItem${i + 1}`,
    }))

    const rows = await parseSheet(buildJspsWorkbook(readTemplateBuffer(), dmp))

    // All 8 data items should appear before Excel row 40 (index 39)
    const dataNamesBeforeOverflow = rows
      .slice(0, 39)
      .map((r) => String(r[1] ?? ""))
      .filter((name) => name.startsWith("DataItem"))
    expect(dataNamesBeforeOverflow.length).toBe(8)
  })

  it("generates Blob even for empty DMP", () => {
    const dmp = initDmp()
    const blob = buildJspsWorkbook(readTemplateBuffer(), dmp)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})

describe("exportToJspsExcel", () => {
  it("returns a Promise<Blob>", () => {
    const dmp = initDmp()
    // exportToJspsExcel is async - just verify it returns a Promise without resolving
    // (full integration tested via buildJspsWorkbook above)
    const result = exportToJspsExcel(dmp)
    expect(result).toBeInstanceOf(Promise)
    // Prevent unhandled rejection in test environment (fetch is not mocked here)
    result.catch(Object)
  })
})
