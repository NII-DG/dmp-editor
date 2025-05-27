import {
  AccountCircleOutlined,
  ArrowDropDownOutlined,
  LogoutOutlined,
  FileCopyOutlined,
  Check,
  OpenInNew,
} from "@mui/icons-material"
import { AppBar, Box, Link, Button, Menu, MenuItem, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useNavigate } from "react-router-dom"
import { useRecoilState } from "recoil"

import { useUser } from "@/hooks/useUser"
import { tokenAtom } from "@/store/token"
import { headerColor } from "@/theme"

interface AppHeaderProps {
  sx?: SxProps
  noAuth?: boolean
}

export default function AppHeader({ sx, noAuth }: AppHeaderProps) {
  const navigate = useNavigate()
  const { showBoundary } = useErrorBoundary()
  const userQuery = useUser()
  if (userQuery.isError && userQuery.error) {
    showBoundary(userQuery.error)
  }

  const [token, setToken] = useRecoilState(tokenAtom)
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const signOut = () => {
    setToken("")
  }

  const menuContent = !noAuth && userQuery.data ? (
    <>
      <Button
        variant="text"
        sx={{
          textTransform: "none",
          color: colors.grey[400],
          "&:hover": { color: "white" },
        }}
        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
      >
        <AccountCircleOutlined sx={{ mr: "0.5rem" }} />
        {userQuery.data.fullName}
        <ArrowDropDownOutlined />
      </Button>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem
          component="a"
          href={userQuery.data.grdmProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ minWidth: "220px" }}
        >
          <OpenInNew sx={{ mr: "0.5rem" }} />
          {"Go to GRDM Profile"}
        </MenuItem>
        <MenuItem onClick={handleCopy} sx={{ minWidth: "220px" }}>
          {copied ? (
            <>
              <Check sx={{ mr: "0.5rem" }} />
              {"Copied!"}
            </>
          ) : (
            <>
              <FileCopyOutlined sx={{ mr: "0.5rem" }} />
              {"Copy Access Token"}
            </>
          )}
        </MenuItem>
        <MenuItem onClick={signOut} sx={{ minWidth: "220px" }}>
          <LogoutOutlined sx={{ mr: "0.5rem" }} />
          {"Sign Out"}
        </MenuItem>
      </Menu>
    </>
  ) : null

  return (
    <AppBar
      position="static"
      sx={{
        ...sx,
        height: "4rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        bgcolor: headerColor,
        boxShadow: "none",
      }}
    >
      <Box sx={{ ml: "1.5rem" }}>
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault()
            navigate("/")
          }}
          sx={{
            textDecoration: "none",
            color: colors.grey[300],
            fontSize: "1.75rem",
            letterSpacing: "0.25rem",
          }}
        >
          {"DMP editor"}
        </Link>
      </Box>
      <Box sx={{ mr: "1.5rem" }}>{menuContent}</Box>
    </AppBar>
  )
}
