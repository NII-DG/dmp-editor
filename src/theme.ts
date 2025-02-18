import { colors } from "@mui/material"
import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
  palette: {
    primary: {
      main: "#337ab7",
    },
    secondary: {
      main: "#CF6B2C",
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600],
    },
  },
})

export default theme
