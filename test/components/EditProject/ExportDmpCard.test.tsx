import { ThemeProvider } from "@mui/material/styles"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ExportDmpCard from "../../../src/components/EditProject/ExportDmpCard"
import type { DmpFormValues } from "../../../src/dmp"
import { initDmp } from "../../../src/dmp"
import { theme } from "../../../src/theme"

// --- Hoisted mocks ---

const { mockShowBoundary, mockExportToJspsExcel, mockExportToExcel, mockTrigger, mockGetValues } = vi.hoisted(
  () => ({
    mockShowBoundary: vi.fn(),
    mockExportToJspsExcel: vi.fn(),
    mockExportToExcel: vi.fn(),
    mockTrigger: vi.fn().mockResolvedValue(true),
    mockGetValues: vi.fn(),
  }),
)

vi.mock("react-error-boundary", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-error-boundary")>()
  return {
    ...original,
    useErrorBoundary: () => ({ showBoundary: mockShowBoundary }),
  }
})

vi.mock("react-hook-form", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-hook-form")>()
  return {
    ...original,
    useFormContext: () => ({
      getValues: mockGetValues,
      trigger: mockTrigger,
      formState: { isValid: true, isSubmitted: false },
    }),
  }
})

vi.mock("@/jspsExport", () => ({
  exportToJspsExcel: mockExportToJspsExcel,
}))

vi.mock("@/excelExport", () => ({
  exportToExcel: mockExportToExcel,
}))

// --- Helpers ---

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

function makeFormValues(overrides: Partial<DmpFormValues> = {}): DmpFormValues {
  return { grdmProjectName: "My GRDM Project", dmp: initDmp(), ...overrides }
}

// --- Tests ---

describe("ExportDmpCard", () => {
  let capturedDownloadAttr: string | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    capturedDownloadAttr = null
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      capturedDownloadAttr = this.download
    })
    mockExportToJspsExcel.mockResolvedValue(new Blob(["test"]))
    mockExportToExcel.mockResolvedValue(new Blob(["test"]))
  })

  describe("filename for download (Bug 1)", () => {
    it("uses dmp-jsps-<grdmProjectName>.xlsx for JSPS format", async () => {
      const user = userEvent.setup()
      mockGetValues.mockReturnValue(makeFormValues({ grdmProjectName: "My GRDM Project" }))

      renderWithTheme(<ExportDmpCard />)

      await user.click(screen.getByRole("button", { name: /DMP を出力する/ }))
      await user.click(screen.getByText("JSPS 形式"))

      await waitFor(() => {
        expect(capturedDownloadAttr).toBe("dmp-jsps-My GRDM Project.xlsx")
      })
    })

    it("uses dmp-sample-<grdmProjectName>.xlsx for sample format", async () => {
      const user = userEvent.setup()
      mockGetValues.mockReturnValue(makeFormValues({ grdmProjectName: "My GRDM Project" }))

      renderWithTheme(<ExportDmpCard />)

      await user.click(screen.getByRole("button", { name: /DMP を出力する/ }))
      await user.click(screen.getByText("サンプル形式"))

      await waitFor(() => {
        expect(capturedDownloadAttr).toBe("dmp-sample-My GRDM Project.xlsx")
      })
    })

    it("falls back to dmp.projectInfo.projectName when grdmProjectName is empty", async () => {
      const user = userEvent.setup()
      const dmp = initDmp()
      dmp.projectInfo.projectName = "Fallback Project"
      mockGetValues.mockReturnValue(makeFormValues({ grdmProjectName: "", dmp }))

      renderWithTheme(<ExportDmpCard />)

      await user.click(screen.getByRole("button", { name: /DMP を出力する/ }))
      await user.click(screen.getByText("JSPS 形式"))

      await waitFor(() => {
        expect(capturedDownloadAttr).toBe("dmp-jsps-Fallback Project.xlsx")
      })
    })

    it("falls back to 'untitled' when both project names are empty", async () => {
      const user = userEvent.setup()
      mockGetValues.mockReturnValue(makeFormValues({ grdmProjectName: "" }))

      renderWithTheme(<ExportDmpCard />)

      await user.click(screen.getByRole("button", { name: /DMP を出力する/ }))
      await user.click(screen.getByText("JSPS 形式"))

      await waitFor(() => {
        expect(capturedDownloadAttr).toBe("dmp-jsps-untitled.xlsx")
      })
    })
  })
})
