import { AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined, DeleteOutline, EditOutlined } from "@mui/icons-material"
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, TableContainer, Paper, Table, TableHead, TableCell, TableRow, TableBody, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState, useEffect, useRef } from "react"
import { useRecoilState } from "recoil"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { accessRights, AccessRights, DataInfo, DataType, dataType, initDataInfo, listingPersonNames, researchField, ResearchField } from "@/dmp"
import { dmpAtom } from "@/store/dmp"

interface DataInfoSectionProps {
  sx?: SxProps
  isNew: boolean
}

const initError = (): Record<keyof DataInfo, string | null> => ({
  dataName: null,
  publicationDate: null,
  description: null,
  acquisitionMethod: null,
  researchField: null,
  dataType: null,
  dataSize: null,
  reuseInformation: null,
  hasSensitiveData: null,
  sensitiveDataPolicy: null,
  usagePolicy: null,
  repositoryInformation: null,
  backupLocation: null,
  publicationPolicy: null,
  accessRights: null,
  plannedPublicationDate: null,
  repository: null,
  dataCreator: null,
  dataManagementAgency: null,
  rorId: null,
  dataManager: null,
  dataManagerContact: null,
  dataStorageLocation: null,
  dataStoragePeriod: null,
})

export default function DataInfoSection({ sx, isNew }: DataInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const [open, setOpen] = useState(false)
  const [currentDataInfo, setCurrentDataInfo] = useState<DataInfo>(initDataInfo)
  const [error, setError] = useState<Record<keyof DataInfo, string | null>>(initError())
  const [addRequested, setAddRequested] = useState(false)
  const isFormValid = Object.values(error).every((value) => value === null)
  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const initRef = useRef(false)
  const personNames = listingPersonNames(dmp)

  const handleOpen = (index = -1) => {
    if (index !== -1) {
      setCurrentDataInfo(dmp.dataInfo[index])
    } else {
      setCurrentDataInfo(initDataInfo)
    }
    setError(initError())
    setOpen(true)
    setUpdateIndex(index)
  }
  const handleClose = () => {
    setOpen(false)
    setUpdateIndex(-1)
  }

  const updateCurrentDataInfo = <K extends keyof DataInfo>(key: K, value: DataInfo[K]) => {
    setCurrentDataInfo((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateError = <K extends keyof DataInfo>(key: K, value: string | null) => {
    setError((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Set initial values
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    if (isNew) {
      // do nothing
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const REQUIRED_KEYS: (keyof DataInfo)[] = ["dataName", "publicationDate", "description", "researchField", "dataType", "publicationPolicy", "repositoryInformation", "accessRights", "repository", "dataManagementAgency", "dataManager", "dataManagerContact"] as const

  const validateValue = <K extends keyof DataInfo>(key: K, value: DataInfo[K]): void => {
    if (REQUIRED_KEYS.includes(key)) {
      if ((Array.isArray(value) && value.length === 0) || value === "") {
        updateError(key, "必須項目です")
        return
      }
    }

    updateError(key, null)
  }

  const changeCurrentValue = <K extends keyof DataInfo>(key: K, value: DataInfo[K]) => {
    updateCurrentDataInfo(key, value)
    validateValue(key, value)
  }

  const appendDataInfoToDmp = (dataInfo: DataInfo) => {
    setDmp((prev) => ({
      ...prev,
      dataInfo: [...prev.dataInfo, dataInfo],
    }))
  }

  const updateDataInfoToDmp = (index: number, dataInfo: DataInfo) => {
    setDmp((prev) => ({
      ...prev,
      dataInfo: prev.dataInfo.map((p, i) => i === index ? dataInfo : p),
    }))
  }

  const removeDataInfoFromDmp = (index: number) => {
    setDmp((prev) => ({
      ...prev,
      dataInfo: prev.dataInfo.filter((_, i) => i !== index),
    }))
  }

  const moveUpDataInfoInDmp = (index: number) => {
    if (index === 0) return
    setDmp((prev) => {
      const dataInfo = [...prev.dataInfo]
      const tmp = dataInfo[index]
      dataInfo[index] = dataInfo[index - 1]
      dataInfo[index - 1] = tmp
      return {
        ...prev,
        dataInfo,
      }
    })
  }

  const moveDownDataInfoInDmp = (index: number) => {
    if (index === dmp.dataInfo.length - 1) return
    setDmp((prev) => {
      const dataInfo = [...prev.dataInfo]
      const tmp = dataInfo[index]
      dataInfo[index] = dataInfo[index + 1]
      dataInfo[index + 1] = tmp
      return {
        ...prev,
        dataInfo,
      }
    })
  }

  const addDataInfo = () => {
    Object.entries(currentDataInfo)
      .forEach(([key, value]) => validateValue(key as keyof DataInfo, value))
    setAddRequested(true)
  }

  useEffect(() => {
    if (!addRequested) return
    if (!isFormValid) return

    if (updateIndex === -1) {
      appendDataInfoToDmp(currentDataInfo)
    } else {
      updateDataInfoToDmp(updateIndex, currentDataInfo)
    }

    setAddRequested(false)
    setOpen(false)
    setUpdateIndex(-1)
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="研究データ情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: "none", mt: "1rem" }}>
          <Table>
            <TableHead sx={{ backgroundColor: colors.grey[100] }}>
              <TableRow>
                <TableCell children="データの名称" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="分野" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="種別" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {dmp.dataInfo.map((dataInfo, index) => (
                <TableRow key={index}>
                  <TableCell children={dataInfo.dataName} sx={{ p: "0.5rem 1rem" }} />
                  <TableCell children={dataInfo.researchField} sx={{ p: "0.5rem 1rem" }} />
                  <TableCell children={dataInfo.dataType} sx={{ p: "0.5rem 1rem" }} />
                  <TableCell sx={{ display: "flex", flexDirection: "row", gap: "1rem", p: "0.5rem 1rem", justifyContent: "flex-end" }} align="right">
                    <Button
                      variant="outlined"
                      color="info"
                      children="Up"
                      startIcon={<ArrowUpwardOutlined />}
                      onClick={() => moveUpDataInfoInDmp(index)}
                      sx={{ textTransform: "none" }}
                      disabled={index === 0}
                    />
                    <Button
                      variant="outlined"
                      color="info"
                      children="Down"
                      startIcon={<ArrowDownwardOutlined />}
                      onClick={() => moveDownDataInfoInDmp(index)}
                      sx={{ textTransform: "none" }}
                      disabled={index === dmp.personInfo.length - 1}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      children="編集"
                      startIcon={<EditOutlined />}
                      onClick={() => handleOpen(index)}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      children="削除"
                      startIcon={<DeleteOutline />}
                      onClick={() => removeDataInfoFromDmp(index)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleOpen()} sx={{ width: "180px", mt: "1rem" }}
          children="データを追加する"
          startIcon={<AddOutlined />}
        />

        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle
            children={updateIndex === -1 ? "管理対象データの追加" : "管理対象データの編集"}
            sx={{ mt: "0.5rem", mx: "1rem" }}
          />
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "0.5rem", mx: "1rem" }}>
            <FormControl fullWidth>
              <OurFormLabel label="管理対象データの名称" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataName}
                onChange={(e) => changeCurrentValue("dataName", e.target.value)}
                error={!!error.dataName}
                helperText={error.dataName}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="掲載日・掲載更新日" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.publicationDate}
                onChange={(e) => changeCurrentValue("publicationDate", e.target.value)}
                error={!!error.publicationDate}
                helperText={error.publicationDate}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                type="date"
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データの説明" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.description}
                onChange={(e) => changeCurrentValue("description", e.target.value)}
                error={!!error.description}
                helperText={error.description}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <OurFormLabel label="管理対象データの取得または収集方法" />
                <HelpChip
                  text={
                    <>
                      {"想定されている関連する標準や方法、品質保証、データの組織化 (命名規則、バージョン管理、フォルダ構造) 等を記述してください。"}
                    </>
                  }
                />
              </Box>
              <TextField
                variant="outlined"
                value={currentDataInfo.acquisitionMethod}
                onChange={(e) => changeCurrentValue("acquisitionMethod", e.target.value)}
                error={!!error.acquisitionMethod}
                helperText={error.acquisitionMethod}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データの分野" required />
              <Select
                variant="outlined"
                value={currentDataInfo.researchField}
                onChange={(e) => changeCurrentValue("researchField", e.target.value as ResearchField)}
                error={!!error.researchField}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              >
                {researchField.map((field) => (
                  <MenuItem key={field} value={field} children={field} />
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データ種別" required />
              <Select
                variant="outlined"
                value={currentDataInfo.dataType}
                onChange={(e) => changeCurrentValue("dataType", e.target.value as DataType)}
                error={!!error.dataType}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              >
                {dataType.map((type) => (
                  <MenuItem key={type} value={type} children={type} />
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <OurFormLabel label="概略データ量" />
                <HelpChip
                  text={
                    <>
                      {"管理対象データの概ねのデータ容量を以下から選択。システムからデータ容量の値を出力できる場合は、データ容量の値そのものをセットしてもよい。"}
                    </>
                  }
                />
              </Box>
              <TextField
                variant="outlined"
                value={currentDataInfo.dataSize}
                onChange={(e) => changeCurrentValue("dataSize", e.target.value)}
                error={!!error.dataSize}
                helperText={error.dataSize}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="再利用を可能にするための情報" />
              <TextField
                variant="outlined"
                value={currentDataInfo.reuseInformation}
                onChange={(e) => changeCurrentValue("reuseInformation", e.target.value)}
                error={!!error.reuseInformation}
                helperText={error.reuseInformation}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="機密情報の有無" />
              <Select
                variant="outlined"
                value={currentDataInfo.hasSensitiveData ?? ""}
                onChange={(e) => changeCurrentValue("hasSensitiveData", e.target.value === "" ? undefined : e.target.value === "true")}
                error={!!error.hasSensitiveData}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              >
                <MenuItem value="" children="選択なし" />
                <MenuItem value="true" children="有" />
                <MenuItem value="false" children="無" />
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="機微情報がある場合の取扱い方針" />
              <TextField
                variant="outlined"
                value={currentDataInfo.sensitiveDataPolicy}
                onChange={(e) => changeCurrentValue("sensitiveDataPolicy", e.target.value)}
                error={!!error.sensitiveDataPolicy}
                helperText={error.sensitiveDataPolicy}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="管理対象データの利活用・提供方針 (研究活動時)" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.usagePolicy}
                onChange={(e) => changeCurrentValue("usagePolicy", e.target.value)}
                error={!!error.usagePolicy}
                helperText={error.usagePolicy}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="リポジトリ情報 (研究活動時)" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.repositoryInformation}
                onChange={(e) => changeCurrentValue("repositoryInformation", e.target.value)}
                error={!!error.repositoryInformation}
                helperText={error.repositoryInformation}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="管理対象データのバックアップ場所 (研究活動時)" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.backupLocation}
                onChange={(e) => changeCurrentValue("backupLocation", e.target.value)}
                error={!!error.backupLocation}
                helperText={error.backupLocation}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="管理対象データの公開・提供方針詳細" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.publicationPolicy}
                onChange={(e) => changeCurrentValue("publicationPolicy", e.target.value)}
                error={!!error.publicationPolicy}
                helperText={error.publicationPolicy}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                multiline
                minRows={3}
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="アクセス権" required />
              <Select
                variant="outlined"
                value={currentDataInfo.accessRights}
                onChange={(e) => changeCurrentValue("accessRights", e.target.value as AccessRights)}
                error={!!error.accessRights}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              >
                {accessRights.map((right) => (
                  <MenuItem key={right} value={right} children={right} />
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="管理対象データの公開予定日" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.plannedPublicationDate}
                onChange={(e) => changeCurrentValue("plannedPublicationDate", e.target.value)}
                error={!!error.plannedPublicationDate}
                helperText={error.plannedPublicationDate}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                type="date"
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="リポジトリ情報 (リポジトリ URL・DOIリンク) (研究活動後)" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.repository}
                onChange={(e) => changeCurrentValue("repository", e.target.value)}
                error={!!error.repository}
                helperText={error.repository}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="管理対象データの作成者" />
              <Select
                variant="outlined"
                value={currentDataInfo.dataCreator ?? ""}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  const newValue = selectedValue === "" ? undefined : Number(selectedValue)
                  changeCurrentValue("dataCreator", newValue)
                }}
                error={!!error.dataCreator}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              >
                <MenuItem value="">選択なし</MenuItem>
                {personNames.map((person, index) => (
                  <MenuItem key={person} value={index + 1} children={person} />
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データ管理機関" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataManagementAgency}
                onChange={(e) => changeCurrentValue("dataManagementAgency", e.target.value)}
                error={!!error.dataManagementAgency}
                helperText={error.dataManagementAgency}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データ管理機関コード (ROR ID)" />
              <TextField
                variant="outlined"
                value={currentDataInfo.rorId}
                onChange={(e) => changeCurrentValue("rorId", e.target.value)}
                error={!!error.rorId}
                helperText={error.rorId}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データ管理者 (部署名等)" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataManager}
                onChange={(e) => changeCurrentValue("dataManager", e.target.value)}
                error={!!error.dataManager}
                helperText={error.dataManager}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="データ管理者の連絡先" required />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataManagerContact}
                onChange={(e) => changeCurrentValue("dataManagerContact", e.target.value)}
                error={!!error.dataManagerContact}
                helperText={error.dataManagerContact}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="研究データの保存場所 (研究事業終了後)" />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataStorageLocation}
                onChange={(e) => changeCurrentValue("dataStorageLocation", e.target.value)}
                error={!!error.dataStorageLocation}
                helperText={error.dataStorageLocation}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="研究データの保存期間 (研究事業終了後)" />
              <TextField
                variant="outlined"
                value={currentDataInfo.dataStoragePeriod}
                onChange={(e) => changeCurrentValue("dataStoragePeriod", e.target.value)}
                error={!!error.dataStoragePeriod}
                helperText={error.dataStoragePeriod}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
            <Button
              children={updateIndex === -1 ? "追加" : "編集"}
              onClick={addDataInfo}
              variant="contained"
              color="secondary"
              disabled={!isFormValid}
            />
            <Button children="キャンセル" onClick={handleClose} variant="outlined" color="secondary" />
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

