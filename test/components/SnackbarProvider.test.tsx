import { ThemeProvider } from "@mui/material/styles"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

import SnackbarProvider from "../../src/components/SnackbarProvider"
import { useSnackbar } from "../../src/hooks/useSnackbar"
import { theme } from "../../src/theme"

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

/** Helper component that calls showSnackbar on button click */
function SnackbarTrigger({
  message,
  severity,
}: {
  message: string
  severity: "success" | "error" | "info"
}) {
  const { showSnackbar } = useSnackbar()
  return <button onClick={() => showSnackbar(message, severity)}>trigger</button>
}

describe("SnackbarProvider", () => {
  it("renders children", () => {
    renderWithTheme(
      <SnackbarProvider>
        <span>child content</span>
      </SnackbarProvider>,
    )
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("does not show snackbar initially", () => {
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="hidden" severity="info" />
      </SnackbarProvider>,
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows message when showSnackbar is called", async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="DMPを保存しました" severity="success" />
      </SnackbarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "trigger" }))

    expect(screen.getByText("DMPを保存しました")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("applies colorError class for error severity", async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="保存に失敗しました" severity="error" />
      </SnackbarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "trigger" }))

    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("colorError")
  })

  it("applies colorSuccess class for success severity", async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="成功" severity="success" />
      </SnackbarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "trigger" }))

    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("colorSuccess")
  })

  it("applies colorInfo class for info severity", async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="情報メッセージ" severity="info" />
      </SnackbarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "trigger" }))

    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("colorInfo")
  })

  it("closes snackbar when close button is clicked", async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <SnackbarProvider>
        <SnackbarTrigger message="閉じるテスト" severity="info" />
      </SnackbarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "trigger" }))
    expect(screen.getByText("閉じるテスト")).toBeInTheDocument()

    // MUI Alert close button has aria-label "Close"
    const closeButton = screen.getByRole("button", { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText("閉じるテスト")).not.toBeInTheDocument()
    })
  })
})

describe("useSnackbar outside SnackbarProvider", () => {
  it("throws an error when used outside SnackbarProvider", () => {
    function BrokenComponent() {
      useSnackbar()
      return null
    }

    const consoleSpy = vi.spyOn(console, "error").mockReturnValue(undefined)
    expect(() => renderWithTheme(<BrokenComponent />)).toThrow(
      "useSnackbar must be used within SnackbarProvider",
    )
    consoleSpy.mockRestore()
  })
})
