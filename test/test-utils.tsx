import { ThemeProvider } from "@mui/material/styles"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { ReactElement } from "react"
import { MemoryRouter } from "react-router-dom"
import { RecoilRoot } from "recoil"

import { theme } from "../src/theme"

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" } = {},
) {
  // React-Query キャッシュはテストごとに破棄
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <RecoilRoot>
          <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
        </RecoilRoot>
      </ThemeProvider>
    </MemoryRouter>,
  )
}
