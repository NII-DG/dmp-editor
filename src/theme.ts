import { colors } from "@mui/material"
import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.indigo[500],
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600],
    },
    background: {
      default: colors.grey[100],
    },
  },
})

export const headerColor = "#333D4D"

export default theme
