import Alert from "@mui/material/Alert"
import Snackbar from "@mui/material/Snackbar"
import { ReactNode, useCallback, useState } from "react"

import { SnackbarContext, SnackbarSeverity } from "@/hooks/useSnackbar"

interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

const AUTO_HIDE_DURATION_MS = 4000

/**
 * Provides a global snackbar notification system via SnackbarContext.
 * Wrap the app (or a subtree) with this provider to enable useSnackbar().
 */
export default function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  })

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity) => {
    setState({ open: true, message, severity })
  }, [])

  const handleClose = () => setState((prev) => ({ ...prev, open: false }))

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={state.open}
        onClose={handleClose}
        autoHideDuration={AUTO_HIDE_DURATION_MS}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={state.severity} sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
