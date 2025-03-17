import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter, Routes, Route } from "react-router"
import { RecoilRoot } from "recoil"

import AuthHelper from "@/components/AuthHelper"
import EditProject from "@/pages/EditProject"
import ErrorPage from "@/pages/ErrorPage"
import Home from "@/pages/Home"
import NotFound from "@/pages/NotFound"
import theme from "@/theme"

export default function App() {
  return (
    <BrowserRouter basename={DMP_EDITOR_BASE}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecoilRoot>
          <ErrorBoundary FallbackComponent={ErrorPage} onReset={() => window.location.reload()}>
            <AuthHelper>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects/new" element={<EditProject isNew />} />
                <Route path="/projects/:projectId" element={<EditProject />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthHelper>
          </ErrorBoundary>
        </RecoilRoot>
      </ThemeProvider>
    </BrowserRouter>
  )
}
