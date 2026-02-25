import { ThemeProvider } from "@mui/material/styles"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReactElement } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { MemoryRouter } from "react-router-dom"
import { RecoilRoot } from "recoil"
import { beforeEach, describe, expect, it, vi } from "vitest"

import FormCard from "../../../src/components/EditProject/FormCard"
import SnackbarProvider from "../../../src/components/SnackbarProvider"
import { initDmp } from "../../../src/dmp"
import type { DmpFormValues } from "../../../src/dmp"
import type { ProjectInfo } from "../../../src/grdmClient"
import type { User } from "../../../src/hooks/useUser"
import { theme } from "../../../src/theme"

// Hoist mocks so they are accessible in vi.mock factories
const { mockNavigate, mockMutate } = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockMutate = vi.fn()
  return { mockNavigate, mockMutate }
})

// Mock heavy subcomponents to keep tests focused
vi.mock("../../../src/components/EditProject/GrdmProject", () => ({
  default: () => <div data-testid="grdm-project">GrdmProject</div>,
}))
vi.mock("../../../src/components/EditProject/DmpMetadataSection", () => ({
  default: () => <div data-testid="dmp-metadata-section">DmpMetadataSection</div>,
}))
vi.mock("../../../src/components/EditProject/ProjectInfoSection", () => ({
  default: () => <div data-testid="project-info-section">ProjectInfoSection</div>,
}))
vi.mock("../../../src/components/EditProject/PersonInfoSection", () => ({
  default: () => <div data-testid="person-info-section">PersonInfoSection</div>,
}))
vi.mock("../../../src/components/EditProject/DataInfoSection", () => ({
  default: () => <div data-testid="data-info-section">DataInfoSection</div>,
}))
vi.mock("../../../src/components/EditProject/ProjectTableSection", () => ({
  default: () => <div data-testid="project-table-section">ProjectTableSection</div>,
}))
vi.mock("../../../src/components/EditProject/FileTreeSection", () => ({
  default: () => <div data-testid="file-tree-section">FileTreeSection</div>,
}))
vi.mock("../../../src/hooks/useUpdateDmp", () => ({
  useUpdateDmp: () => ({ mutate: mockMutate }),
}))
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: "test-project-id" }),
  }
})

const mockUser: User = {
  grdmId: "user123",
  fullName: "Test User",
  givenName: "Test",
  familyName: "User",
  givenNameJa: null,
  familyNameJa: null,
  orcid: null,
  researcherId: null,
  affiliation: "Test Institution",
  timezone: "Asia/Tokyo",
  email: "test@example.com",
  grdmProfileUrl: "https://example.com/profile",
  profileImage: "https://example.com/profile.jpg",
}

const mockProjects: ProjectInfo[] = []

function FormCardWrapper({
  isNew = false,
  defaultValues,
}: {
  isNew?: boolean
  defaultValues?: Partial<DmpFormValues>
}) {
  const dmp = initDmp(null)
  const methods = useForm<DmpFormValues>({
    defaultValues: {
      grdmProjectName: "",
      dmp,
      ...defaultValues,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  })
  return (
    <FormProvider {...methods}>
      <FormCard isNew={isNew} user={mockUser} projects={mockProjects} />
    </FormProvider>
  )
}

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <RecoilRoot>
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider>{ui}</SnackbarProvider>
          </QueryClientProvider>
        </RecoilRoot>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe("FormCard with Stepper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Stepper rendering", () => {
    it("renders 5 step labels", () => {
      renderWithProviders(<FormCardWrapper />)
      expect(screen.getByText("基本設定")).toBeInTheDocument()
      expect(screen.getByText("プロジェクト情報")).toBeInTheDocument()
      expect(screen.getByText("担当者情報")).toBeInTheDocument()
      expect(screen.getByText("研究データ情報")).toBeInTheDocument()
      expect(screen.getByText("GRDM 連携")).toBeInTheDocument()
    })

    it("shows step 1 content (DmpMetadataSection) by default", () => {
      renderWithProviders(<FormCardWrapper />)
      expect(screen.getByTestId("dmp-metadata-section")).toBeInTheDocument()
    })

    it("does not show step 2 content by default", () => {
      renderWithProviders(<FormCardWrapper />)
      expect(screen.queryByTestId("project-info-section")).not.toBeInTheDocument()
    })
  })

  describe("navigation buttons", () => {
    it("renders 前へ button (disabled at step 1)", () => {
      renderWithProviders(<FormCardWrapper />)
      const backBtn = screen.getByRole("button", { name: "前へ" })
      expect(backBtn).toBeInTheDocument()
      expect(backBtn).toBeDisabled()
    })

    it("renders 次へ button at step 1", () => {
      renderWithProviders(<FormCardWrapper />)
      expect(screen.getByRole("button", { name: "次へ" })).toBeInTheDocument()
    })

    it("renders save button at step 1", () => {
      renderWithProviders(<FormCardWrapper />)
      expect(screen.getByRole("button", { name: /GRDM に保存する/ })).toBeInTheDocument()
    })
  })

  describe("step navigation", () => {
    it("advances to step 2 when 次へ is clicked (with valid data)", async () => {
      const user = userEvent.setup()
      // Provide valid default values for step 1 fields
      renderWithProviders(
        <FormCardWrapper
          defaultValues={{
            grdmProjectName: "Test Project",
            dmp: {
              ...initDmp(null),
              metadata: {
                revisionType: "新規",
                submissionDate: "2024-01-01",
                dateCreated: "2024-01-01",
                dateModified: "2024-01-01",
                researchPhase: "計画時",
              },
            },
          }}
        />,
      )

      await user.click(screen.getByRole("button", { name: "次へ" }))

      await waitFor(() => {
        expect(screen.getByTestId("project-info-section")).toBeInTheDocument()
      })
    })

    it("goes back to step 1 when 前へ is clicked from step 2", async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FormCardWrapper
          defaultValues={{
            grdmProjectName: "Test Project",
            dmp: {
              ...initDmp(null),
              metadata: {
                revisionType: "新規",
                submissionDate: "2024-01-01",
                dateCreated: "2024-01-01",
                dateModified: "2024-01-01",
                researchPhase: "計画時",
              },
            },
          }}
        />,
      )

      // Advance to step 2
      await user.click(screen.getByRole("button", { name: "次へ" }))
      await waitFor(() => {
        expect(screen.getByTestId("project-info-section")).toBeInTheDocument()
      })

      // Go back to step 1
      await user.click(screen.getByRole("button", { name: "前へ" }))
      await waitFor(() => {
        expect(screen.getByTestId("dmp-metadata-section")).toBeInTheDocument()
      })
    })

    it("jumps to step 3 when clicking the step label directly", async () => {
      const user = userEvent.setup()
      renderWithProviders(<FormCardWrapper />)

      await user.click(screen.getByText("担当者情報"))

      await waitFor(() => {
        expect(screen.getByTestId("person-info-section")).toBeInTheDocument()
      })
    })

    it("does not show 次へ button at step 5 (last step)", async () => {
      const user = userEvent.setup()
      renderWithProviders(<FormCardWrapper />)

      // Jump to step 5 directly
      await user.click(screen.getByText("GRDM 連携"))

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "次へ" })).not.toBeInTheDocument()
      })
    })

    it("前へ button is enabled at step 2", async () => {
      const user = userEvent.setup()
      renderWithProviders(<FormCardWrapper />)

      await user.click(screen.getByText("プロジェクト情報"))

      await waitFor(() => {
        const backBtn = screen.getByRole("button", { name: "前へ" })
        expect(backBtn).not.toBeDisabled()
      })
    })
  })

  describe("save button visibility across all steps", () => {
    const stepLabels = ["基本設定", "プロジェクト情報", "担当者情報", "研究データ情報", "GRDM 連携"]

    for (const label of stepLabels) {
      it(`shows save button on step: ${label}`, async () => {
        const user = userEvent.setup()
        renderWithProviders(<FormCardWrapper />)

        await user.click(screen.getByText(label))

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /GRDM に保存する/ })).toBeInTheDocument()
        })
      })
    }
  })

  describe("step 5 GRDM content", () => {
    it("shows ProjectTableSection and FileTreeSection at step 5", async () => {
      const user = userEvent.setup()
      renderWithProviders(<FormCardWrapper />)

      await user.click(screen.getByText("GRDM 連携"))

      await waitFor(() => {
        expect(screen.getByTestId("project-table-section")).toBeInTheDocument()
        expect(screen.getByTestId("file-tree-section")).toBeInTheDocument()
      })
    })
  })

  describe("page title", () => {
    it("shows 新規作成 when isNew=true", () => {
      renderWithProviders(<FormCardWrapper isNew />)
      expect(screen.getByText("DMP Project の新規作成")).toBeInTheDocument()
    })

    it("shows 編集 when isNew=false", () => {
      renderWithProviders(<FormCardWrapper isNew={false} />)
      expect(screen.getByText("DMP Project の編集")).toBeInTheDocument()
    })
  })

  describe("save and navigate on last step (GRDM 連携)", () => {
    it("navigates to detail page after successful save on last step (existing project)", async () => {
      const user = userEvent.setup()
      // Simulate mutate calling onSuccess
      mockMutate.mockImplementation((_args: unknown, { onSuccess }: { onSuccess: (id: string) => void }) => {
        onSuccess("test-project-id")
      })

      renderWithProviders(<FormCardWrapper isNew={false} />)

      // Jump to last step
      await user.click(screen.getByText("GRDM 連携"))
      await waitFor(() => {
        expect(screen.getByTestId("project-table-section")).toBeInTheDocument()
      })

      // Click save
      await user.click(screen.getByRole("button", { name: /GRDM に保存する/ }))

      // Should navigate to detail page without requiring modal interaction
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/projects/test-project-id/detail")
      })
    })

    it("navigates to detail page after successful save on last step (new project)", async () => {
      const user = userEvent.setup()
      mockMutate.mockImplementation((_args: unknown, { onSuccess }: { onSuccess: (id: string) => void }) => {
        onSuccess("new-project-id")
      })

      renderWithProviders(<FormCardWrapper isNew />)

      // Jump to last step
      await user.click(screen.getByText("GRDM 連携"))
      await waitFor(() => {
        expect(screen.getByTestId("project-table-section")).toBeInTheDocument()
      })

      // Click save
      await user.click(screen.getByRole("button", { name: /GRDM に保存する/ }))

      // Should navigate to the new project's detail page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/projects/new-project-id/detail")
      })
    })

    it("does NOT navigate after save on non-last step (existing project)", async () => {
      const user = userEvent.setup()
      mockMutate.mockImplementation((_args: unknown, { onSuccess }: { onSuccess: (id: string) => void }) => {
        onSuccess("test-project-id")
      })

      renderWithProviders(<FormCardWrapper isNew={false} />)

      // Stay on step 1 (not last step) and click save
      await user.click(screen.getByRole("button", { name: /GRDM に保存する/ }))

      // Should NOT navigate for existing project on non-last step
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })
})
