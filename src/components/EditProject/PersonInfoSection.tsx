import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
} from "@mui/icons-material"
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  Chip,
  Select,
} from "@mui/material"
import React, { useState } from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"

import type { PersonInfo } from "@/dmp"

const defaultPerson: PersonInfo = {
  role: [],
  lastName: "",
  firstName: "",
  eRadResearcherId: undefined,
  orcid: undefined,
  affiliation: "",
}

export default function PersonInfoSection() {
  const { control } = useFormContext<{ personInfo: PersonInfo[] }>()
  const { fields, append, remove, move } = useFieldArray<PersonInfo>({
    control,
    name: "personInfo",
  })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleOpen = (idx: number | null) => setOpenIndex(idx)
  const handleClose = () => setOpenIndex(null)

  const renderDialog = () => {
    if (openIndex === null) return null
    const isNew = openIndex === fields.length
    return (
      <Dialog open onClose={handleClose}>
        <DialogTitle>{isNew ? "担当者を追加" : "担当者を編集"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            name={`personInfo.${openIndex}.role`}
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <Select
                  {...field}
                  multiple
                  label="役割"
                  renderValue={(vals) => (vals as string[]).join(", ")}
                  size="small"
                >
                  {[
                    "研究代表者",
                    "研究分担者",
                    "管理対象データの作成者",
                    "管理対象データの管理責任者",
                  ].map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          {(["lastName", "firstName", "eRadResearcherId", "orcid", "affiliation"] as const).map(
            (key) => (
              <Controller
                key={key}
                name={`personInfo.${openIndex}.${key}`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={
                      key === "lastName"
                        ? "姓"
                        : key === "firstName"
                          ? "名"
                          : key === "eRadResearcherId"
                            ? "e-Rad 研究者番号"
                            : key === "orcid"
                              ? "ORCID"
                              : "所属機関"
                    }
                    fullWidth
                    size="small"
                  />
                )}
              />
            ),
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              append(defaultPerson)
              handleClose()
            }}
            startIcon={<AddOutlined />}
          >
            追加
          </Button>
          <Button onClick={handleClose} variant="outlined">
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddOutlined />}
          onClick={() => handleOpen(fields.length)}
        >
          担当者を追加
        </Button>
      </Box>
      {fields.map((field, idx) => (
        <Box
          key={field.id}
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
        >
          <Chip label={`${field.lastName} ${field.firstName}`} />
          <Button onClick={() => move(idx, idx - 1)} disabled={idx === 0}>
            <ArrowUpwardOutlined />
          </Button>
          <Button
            onClick={() => move(idx, idx + 1)}
            disabled={idx === fields.length - 1}
          >
            <ArrowDownwardOutlined />
          </Button>
          <Button onClick={() => handleOpen(idx)}>
            <EditOutlined />
          </Button>
          <Button onClick={() => remove(idx)}>
            <DeleteOutline />
          </Button>
        </Box>
      ))}
      {renderDialog()}
    </Box>
  )
}
