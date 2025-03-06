import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter, Routes, Route } from "react-router"
import { RecoilRoot } from "recoil"

import EditProject from "@/pages/EditProject"
import ErrorPage from "@/pages/ErrorPage"
import Home from "@/pages/Home"
import NewProject from "@/pages/NewProject"
import NotFound from "@/pages/NotFound"
import theme from "@/theme"

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecoilRoot>
          <ErrorBoundary FallbackComponent={ErrorPage} onReset={() => window.location.reload()}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/project/new" element={<NewProject />} />
              <Route path="/project/:projectId" element={<EditProject />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </RecoilRoot>
      </ThemeProvider>
    </BrowserRouter>
  )
}
