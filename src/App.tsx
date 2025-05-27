import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { QueryClientProvider } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter, Routes, Route } from "react-router"
import { RecoilRoot } from "recoil"

import AuthHelper from "@/components/AuthHelper"
import StatusPage from "@/components/StatusPage"
import EditProject from "@/pages/EditProject"
import Home from "@/pages/Home"
import { queryClient } from "@/queryClient"
import theme from "@/theme"

export default function App() {
  return (
    <BrowserRouter basename={DMP_EDITOR_BASE}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecoilRoot>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary
              fallbackRender={({ error, resetErrorBoundary }) => (
                <StatusPage type="error" error={error} resetErrorBoundary={resetErrorBoundary} />
              )}
              onReset={() => window.location.reload()}
            >
              <AuthHelper>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/projects/new" element={<EditProject isNew />} />
                  <Route path="/projects/:projectId" element={<EditProject />} />
                  <Route path="*" element={<StatusPage type="notfound" />} />
                </Routes>
              </AuthHelper>
            </ErrorBoundary>
          </QueryClientProvider>
        </RecoilRoot>
      </ThemeProvider>
    </BrowserRouter>
  )
}
