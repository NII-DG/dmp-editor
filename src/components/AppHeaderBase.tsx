import { Box, AppBar, Typography, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { Link } from "react-router"

import { headerColor } from "@/theme"

interface AppHeaderBaseProps {
  sx?: SxProps
  leftChildren?: React.ReactNode
  rightChildren?: React.ReactNode
}

export default function AppHeaderBase({ sx, leftChildren, rightChildren }: AppHeaderBaseProps) {
  return (
    <AppBar position="static" sx={{
      ...sx,
      height: "4rem",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      bgcolor: headerColor,
      boxShadow: "none",
    }}>
      {/* Left Box */}
      <Box sx={{ ml: "1.5rem" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <Typography
            sx={{
              color: colors.grey[300],
              fontSize: "1.75rem",
              letterSpacing: "0.25rem",
            }}
            component="span"
            children="DMP editor"
          />
        </Link>
        {leftChildren}
      </Box>

      {/* Right Box */}
      <Box sx={{ mr: "1.5rem" }}>
        {rightChildren}
      </Box>
    </AppBar>
  )
}
