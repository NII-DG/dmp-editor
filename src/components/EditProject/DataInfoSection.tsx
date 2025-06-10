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
  Select,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material"
import React, { useState } from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"

import type { Dmp, DataInfo } from "@/dmp"

const defaultData: DataInfo = {
  dataName: "",
  publicationDate: "",
  description: "",
  acquisitionMethod: undefined,
  researchField: "ライフサイエンス",
  dataType: "データセット",
  dataSize: undefined,
  reuseInformation: undefined,
  hasSensitiveData: undefined,
  sensitiveDataPolicy: undefined,
  usagePolicy: "",
  repositoryInformation: "",
  backupLocation: undefined,
  publicationPolicy: undefined,
  accessRights: "公開",
  plannedPublicationDate: "",
  repository: "",
  dataCreator: undefined,
  dataManagementAgency: "",
  rorId: undefined,
  dataManager: "",
  dataManagerContact: "",
  dataStorageLocation: undefined,
  dataStoragePeriod: undefined,
}

export default function DataInfoSection() {
  const { control } = useFormContext<Dmp>()
  const { fields, append, remove, move } = useFieldArray<Dmp, "dataInfo">({
    control,
    name: "dataInfo",
  })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleOpen = (idx: number | null) => setOpenIndex(idx)
  const handleClose = () => setOpenIndex(null)

  const renderDialog = () => {
    if (openIndex === null) return null
    const isNew = openIndex === fields.length
    return (
      <Dialog open onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{isNew ? "データを追加" : "データを編集"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            name={`dataInfo.${openIndex}.dataName`}
            control={control}
            render={({ field }) => (
              <TextField {...field} label="名称" fullWidth size="small" />
            )}
          />
          <Controller
            name={`dataInfo.${openIndex}.researchField`}
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <Select {...field}>
                  {["ライフサイエンス", "情報通信", "環境", "ナノテク・材料", "エネルギー", "ものづくり技術", "社会基盤", "フロンティア", "人文・社会", "自然科学一般", "その他"].map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name={`dataInfo.${openIndex}.dataType`}
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <Select {...field}>
                  {["データセット", "集計データ", "臨床試験データ", "編集データ", "符号化データ", "実験データ", "ゲノムデータ", "地理空間データ", "実験ノート", "測定・評価データ", "観測データ", "記録データ", "シミュレーションデータ", "調査データ"].map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          {/* 他のフィールドも同様に Controller を追加 */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { append(defaultData); handleClose() }} startIcon={<AddOutlined />}>
            {isNew ? "追加" : "更新"}
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
        <Button variant="outlined" startIcon={<AddOutlined />} onClick={() => handleOpen(fields.length)}>
          データを追加
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>分野</TableCell>
              <TableCell>種別</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, idx) => (
              <TableRow key={field.id}>
                <TableCell>{field.dataName}</TableCell>
                <TableCell>{field.researchField}</TableCell>
                <TableCell>{field.dataType}</TableCell>
                <TableCell>
                  <Button onClick={() => move(idx, idx - 1)} disabled={idx === 0}><ArrowUpwardOutlined /></Button>
                  <Button onClick={() => move(idx, idx + 1)} disabled={idx === fields.length - 1}><ArrowDownwardOutlined /></Button>
                  <Button onClick={() => handleOpen(idx)}><EditOutlined /></Button>
                  <Button onClick={() => remove(idx)}><DeleteOutline /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {renderDialog()}
    </Box>
  )
}
