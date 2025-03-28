import { AccountCircleOutlined, ArrowDropDownOutlined, LogoutOutlined, FileCopyOutlined, Check, OpenInNew } from "@mui/icons-material"
import { Button, Menu, MenuItem, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useErrorBoundary } from "react-error-boundary"
import { useRecoilState, useRecoilValueLoadable } from "recoil"

import AppHeaderBase from "@/components/AppHeaderBase"
import { tokenAtom } from "@/store/token"
import { userSelector } from "@/store/user"

interface AppHeaderProps {
  sx?: SxProps
}

export default function AppHeader({ sx }: AppHeaderProps) {
  const { showBoundary } = useErrorBoundary()

  const user = useRecoilValueLoadable(userSelector)
  if (user.state === "hasError") {
    showBoundary(user.contents)
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

  return (
    <AppHeaderBase
      sx={sx}
      leftChildren={null}
      rightChildren={
        (user.state === "hasValue" && user.contents) ? (
          <>
            <Button
              variant="text"
              sx={{ textTransform: " none", color: colors.grey[400], "&:hover": { color: "white" } }}
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            >
              <AccountCircleOutlined sx={{ mr: "0.5rem" }} />
              {`${user.contents.fullName}`}
              <ArrowDropDownOutlined />
            </Button>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
            >
              <MenuItem
                component="a"
                href={user.contents.grdmProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ minWidth: "220px" }}
              >
                <OpenInNew sx={{ mr: "0.5rem" }} />
                {"Go to GRDM Profile"}
              </MenuItem>
              <MenuItem onClick={handleCopy} sx={{ minWidth: "220px" }}>
                {copied ? <>
                  <Check sx={{ mr: "0.5rem" }} />
                  {"Copied!"}
                </> : <>
                  <FileCopyOutlined sx={{ mr: "0.5rem" }} />
                  {"Copy Access Token"}
                </>}
              </MenuItem>
              <MenuItem onClick={signOut} sx={{ minWidth: "220px" }}>
                <LogoutOutlined sx={{ mr: "0.5rem" }} />
                {"Sign Out"}
              </MenuItem>
            </Menu>
          </>
        ) : null
      }
    />
  )
}
