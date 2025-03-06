import { Box, AppBar, colors, Link } from "@mui/material"
import { SxProps } from "@mui/system"
import { useNavigate } from "react-router"

import { headerColor } from "@/theme"

interface AppHeaderBaseProps {
  sx?: SxProps
  leftChildren?: React.ReactNode
  rightChildren?: React.ReactNode
}

export default function AppHeaderBase({ sx, leftChildren, rightChildren }: AppHeaderBaseProps) {
  const navigate = useNavigate()

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
        <Link
          href="/"
          onClick={(event) => {
            event?.preventDefault()
            navigate("/")
          }}
          sx={{
            textDecoration: "none",
            color: colors.grey[300],
            fontSize: "1.75rem",
            letterSpacing: "0.25rem",
          }}
          children="DMP editor"
        />
        {leftChildren}
      </Box>

      {/* Right Box */}
      <Box sx={{ mr: "1.5rem" }}>
        {rightChildren}
      </Box>
    </AppBar>
  )
}
