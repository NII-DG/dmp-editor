import { HelpOutlineOutlined } from "@mui/icons-material"
import { IconButton, Popover, Box, Typography } from "@mui/material"
import { SxProps } from "@mui/system"
import React, { useState } from "react"

export interface HelpChipProps {
  sx?: SxProps
  text: React.ReactNode
}

export default function HelpChip({ sx, text }: HelpChipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <Box sx={{ mb: "0.25rem", ...sx }}>
      <IconButton onClick={handleClick} size="small">
        <HelpOutlineOutlined />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: "1rem", maxWidth: "360px", whiteSpace: "normal" }}>
          <Typography variant="body2">{text}</Typography>
        </Box>
      </Popover>
    </Box>
  )
}
