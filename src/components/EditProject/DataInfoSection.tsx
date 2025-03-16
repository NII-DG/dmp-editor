import { AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined, DeleteOutline, EditOutlined } from "@mui/icons-material"
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControl, Chip, TableContainer, Paper, Table, TableHead, TableCell, TableRow, TableBody, colors, Select, FormHelperText } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState, useEffect, useRef } from "react"
import { useRecoilState } from "recoil"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { initDataInfo, DataInfo, dataType, dataInfoKeys, researchField, accessRights, hasSensitiveData, listingPersonNames } from "@/dmp"
import { dmpAtom } from "@/store/dmp"
import theme from "@/theme"

interface DataInfoSectionProps {
  sx?: SxProps
  isNew: boolean
}

interface FormData {
  key: keyof DataInfo
  label: string
  required: boolean
  placeholder?: string
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
  selectMultiple?: boolean
  helpChip?: React.ReactNode
  minRows?: number
}

const formData: FormData[] = [
  {
    key: "dataName",
    label: "名称",
    required: true,
    type: "text",
    placeholder: "e.g., ○○の実証における○○撮像データ",
    helpChip: (<>
      {"e.g., ○○の実証における○○撮像データ, ○○シミュレーションデータ"}
    </>),
  },
  {
    key: "publicationDate",
    label: "掲載日・掲載更新日",
    required: true,
    type: "date",
  },
  {
    key: "description",
    label: "説明",
    required: true,
    type: "text",
    placeholder: "e.g., ○○実証において、○○撮像画像データ",
    helpChip: (<>
      {"e.g., ○○実証において、○○撮像画像データ。○○ (規格) を利用した撮像データ (日時、気温、天候、センサの設置場所等の詳細情報を含む)"}
      <br />
      {"e.g., ○○時の○○の挙動を予想するためシミュレーションによって得られるデータ。"}
    </>),
    minRows: 3,
  },
  {
    key: "acquisitionMethod",
    label: "データの取得または収集方法",
    required: false,
    type: "text",
    placeholder: "e.g., センサを設置し、自ら取得, 自らシミュレーションを行い取得",
    helpChip: (<>
      {"想定されている関連する標準や方法、品質保証、データの組織化 (命名規則、バージョン管理、フォルダ構造) 等を記述してください。"}
      <br />
      {"e.g., センサを設置し、自ら取得, 自らシミュレーションを行い取得"}
    </>),
    minRows: 3,
  },
  {
    key: "researchField",
    label: "データの分野",
    required: true,
    type: "select",
    options: [...researchField],
  },
  {
    key: "dataType",
    label: "データの種別",
    required: true,
    type: "select",
    options: [...dataType],
  },
  {
    key: "dataSize",
    label: "概略データ量",
    required: false,
    type: "text",
    placeholder: "e.g., <1GB, 1-10GB, 10-100GB, >100GB",
    helpChip: (<>
      {"管理対象データの概ねのデータ容量を以下から選択。"}
      <br />
      {"e.g.,<1GB, 1-10GB, 10-100GB, >100GB"}
      <br />
      {"システムからデータ容量の値を出力できる場合は、データ容量の値そのものをセットしてください。"}
    </>),
  },
  {
    key: "reuseInformation",
    label: "再利用を可能にするための情報",
    required: false,
    type: "text",
    placeholder: "e.g., データ項目に関するコードブックあり",
    helpChip: (<>
      {"可読性を保証するメタデータ等の情報を記載してください"}
    </>),
    minRows: 3,
  },
  {
    key: "hasSensitiveData",
    label: "機密情報の有無",
    required: false,
    type: "select",
    options: [...hasSensitiveData],
  },
  {
    key: "sensitiveDataPolicy",
    label: "機微情報がある場合の取扱い方針",
    required: false,
    type: "text",
    placeholder: "e.g., 個人情報の取扱いについては、関係法令を遵守する。",
    helpChip: (<>
      {"データの保存や共有に関する同意、匿名化処理、センシティブデータの扱い等を記述してください。"}
      <br />
      {"e.g., 個人情報の取扱いについては、関係法令を遵守する。企業との共同研究契約に基づき研究データを管理する。"}
    </>),
    minRows: 3,
  },
  {
    key: "usagePolicy",
    label: "データの利活用・提供方針 (研究活動時)",
    required: true,
    type: "text",
    placeholder: "e.g., △△のデータは取得後随時公開、○○のデータは一定期間経過の後公開",
    helpChip: (<>
      {"e.g., △△のデータは取得後随時公開、○○のデータは一定期間経過の後公開"}
      <br />
      {"e.g., 企業との共同研究も予定していることから、基本的には非公開とする。公開しても問題ないと研究データ取得者が判断したデータについては、研究事業期間中でも広く一般に向け公開することも可能とする。"}
    </>),
    minRows: 3,
  },
  {
    key: "repositoryInformation",
    label: "リポジトリ情報 (研究活動時)",
    required: true,
    type: "text",
    placeholder: "e.g., 研究代表者が所属する○○大学 (研究室) のストレージで保存",
    helpChip: (<>
      {"e.g., 研究代表者が所属する○○大学 (研究室) のストレージで保存"}
      <br />
      {"e.g., 研究中は、各データ取得者が所属する大学 (研究室) のストレージで保存"}
    </>),
    minRows: 3,
  },
  {
    key: "backupLocation",
    label: "データのバックアップ場所 (研究活動時)",
    required: false,
    type: "text",
    placeholder: "e.g., 研究代表者が所属する○○大学 (研究室) のストレージのバックアップサービスによる",
    helpChip: (<>
      {"e.g., 研究代表者が所属する○○大学 (研究室) のストレージのバックアップサービスによる"}
      <br />
      {"e.g., 各データ取得者が所属する大学（研究室)。機関のストレージのバックアップサービスによる"}
    </>),
    minRows: 3,
  },
  {
    key: "publicationPolicy",
    label: "データの公開・提供方針詳細",
    required: false,
    type: "text",
    placeholder: "e.g., 取得後随時公開",
    helpChip: (<>
      {"e.g., 取得後随時公開"}
      <br />
      {"e.g., ○○のデータは研究事業終了後までは非公開とし、終了後 (論文発表後) に一部公開開始。同研究室内 (同プロジェクトメンバー内) でのみ共有。"}
    </>),
    minRows: 3,
  },
  {
    key: "accessRights",
    label: "アクセス権",
    required: true,
    type: "select",
    options: [...accessRights],
  },
  {
    key: "plannedPublicationDate",
    label: "データの公開予定日",
    required: false,
    type: "date",
  },
  {
    key: "repository",
    label: "リポジトリ情報 (リポジトリ URL・DOI リンク) (研究活動後)",
    required: true,
    type: "text",
    placeholder: "e.g., ○○大学機関リポジトリ, https://doi.org/10.12345/abcde",
    helpChip: (<>
      {"「リポジトリURL・DOIリンク」につきましては、情報がある場合に入力ください。"}
      <br />
      {"DOIが付与されている場合はDOIリンク、DOIが付与されていない場合は当該の管理対象データのランディングページのURLをご記入下さい"}
      <br />
      {"e.g., ○○大学機関リポジトリ, https://doi.org/10.12345/abcde"}
    </>),
  },
  {
    key: "dataCreator",
    label: "データの作成者",
    required: false,
    helperText: "これらの選択肢は、担当者情報から生成されます",
    type: "select",
    options: [], // update before use based on person info
  },
  {
    key: "dataManagementAgency",
    label: "データ管理機関",
    required: true,
    type: "text",
    placeholder: "e.g., ○○大学",
  },
  {
    key: "rorId",
    label: "データ管理機関コード (ROR ID)",
    required: false,
    type: "text",
    placeholder: "e.g., https://ror.org/123456789",
    helpChip: (<>
      {"データ管理機関の Research Organization Registry (ROR) コードがあれば記載して下さい。"}
      <br />
      {"e.g., https://ror.org/123456789"}
    </>),
  },
  {
    key: "dataManager",
    label: "データ管理者 (部署名等)",
    required: true,
    type: "text",
    placeholder: "e.g., ××推進部",
    helpChip: (<>
      {"データ管理機関において各管理対象データを管理する部署名または担当者の名前を入力してください。"}
      <br />
      {"e.g., ××推進部, △△研究室"}
    </>),
  },
  {
    key: "dataManagerContact",
    label: "データ管理者の連絡先",
    required: true,
    type: "text",
    placeholder: "e.g., xxx@xxx, 〇〇県〇〇市××",
    helpChip: (<>
      {"個人情報保護の観点から、個人ではなく組織の連絡先が望ましいです。"}
      <br />
      {"e.g., xxx@xxx, 〇〇県〇〇市××"}
    </>),
  },
  {
    key: "dataStorageLocation",
    label: "研究データの保存場所 (研究事業終了後)",
    required: false,
    type: "text",
    placeholder: "e.g., ○○大学機関リポジトリ, △△研究所内データサーバー",
  },
  {
    key: "dataStoragePeriod",
    label: "研究データの保存期間 (研究事業終了後)",
    required: false,
    type: "text",
    placeholder: "e.g., 永久保存, 10年",
  },
]

const requiredKeys = formData.filter((data) => data.required).map((data) => data.key)

const initErrors = (): Record<keyof DataInfo, string | null> => {
  return (dataInfoKeys).reduce((acc, key) => {
    acc[key] = null
    return acc
  }, {} as Record<keyof DataInfo, string | null>)
}

const initFormTouchedState = (state = false): Record<keyof DataInfo, boolean> => {
  return (dataInfoKeys).reduce((acc, key) => {
    acc[key] = state
    return acc
  }, {} as Record<keyof DataInfo, boolean>)
}

export default function DataInfoSection({ sx, isNew }: DataInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const [open, setOpen] = useState(false)
  const [currentDataInfo, setCurrentDataInfo] = useState<DataInfo>(initDataInfo())
  const [touched, setTouched] = useState(initFormTouchedState())
  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const initRef = useRef(false)
  const [appendTrigger, setAppendTrigger] = useState(false)

  const getValue = <K extends keyof DataInfo>(key: K): DataInfo[K] => {
    if (key === "hasSensitiveData" || key === "dataCreator") {
      return (currentDataInfo[key] ?? "") as DataInfo[K]
    }
    if (key === "dataCreator") {
      const personNames = listingPersonNames(dmp)
      return (personNames[(currentDataInfo[key] as number) - 1] ?? "") as DataInfo[K]
    }
    return currentDataInfo[key]
  }

  const getOptions = (key: keyof DataInfo): string[] => {
    if (key === "dataCreator") {
      return dmp.personInfo.map((person) => `${person.lastName} ${person.firstName}`.trim())
    }
    return formData.find((data) => data.key === key)?.options ?? []
  }

  const validate = <K extends keyof DataInfo>(key: K, value: DataInfo[K]): string | null => {
    if (requiredKeys.includes(key)) {
      if (Array.isArray(value) && value.length === 0) return "必須項目です"
      else if (value === "") return "必須項目です"
    }
    if (key === "plannedPublicationDate" && currentDataInfo.accessRights === "公開期間猶予") {
      return "アクセス権が「公開期間猶予」の場合、公開予定日を入力してください"
    }
    return null
  }

  const errors = (() => {
    const errors = initErrors()
    for (const key of dataInfoKeys) {
      if (!touched[key]) continue
      errors[key] = validate(key, currentDataInfo[key])
    }
    return errors
  })()
  const isFormValid = Object.values(errors).every((value) => value === null)

  const updateValue = <K extends keyof DataInfo>(key: K, value: DataInfo[K]) => {
    let newValue = value
    if (key === "dataCreator") {
      const personNames = listingPersonNames(dmp)
      newValue = (personNames.indexOf(value as string) + 1) as DataInfo[K]
    }

    setCurrentDataInfo((prev) => ({
      ...prev,
      [key]: newValue,
    }))
  }

  const updateTouched = (key: keyof DataInfo) => {
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }))
  }

  const handleOpen = (index = -1) => {
    if (index !== -1) {
      setCurrentDataInfo(dmp.dataInfo[index])
    } else {
      setCurrentDataInfo(initDataInfo())
    }
    setTouched(initFormTouchedState())
    setOpen(true)
    setUpdateIndex(index)
  }

  const handleClose = () => {
    setOpen(false)
    setUpdateIndex(-1)
  }

  // Set initial values
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    if (isNew) {
      // do nothing
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setTouched(initFormTouchedState(true))
    setAppendTrigger(true)
  }

  useEffect(() => {
    // Use useEffect to re-evaluate the form validation (isFormValid) when appendTrigger changes
    if (!appendTrigger) return

    if (isFormValid) {
      if (updateIndex === -1) {
        appendDataInfoToDmp(currentDataInfo)
      } else {
        updateDataInfoToDmp(updateIndex, currentDataInfo)
      }
      setOpen(false)
      setUpdateIndex(-1)
    }
    setAppendTrigger(false)
  }, [appendTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="研究データ情報" />
      <TableContainer component={Paper} variant="outlined" sx={{
        borderBottom: "none",
        mt: "1rem",
        width: "100%",
        overflowX: "auto",
      }}>
        <Table sx={{ minWidth: theme.breakpoints.values.md }}>
          <TableHead sx={{ backgroundColor: colors.grey[100] }}>
            <TableRow>
              {["名称", "分野", "種別", ""].map((header, index) => (
                <TableCell
                  key={index}
                  children={header}
                  sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }}
                />
              ))}
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
                    children={"Up"}
                    startIcon={<ArrowUpwardOutlined />}
                    onClick={() => moveUpDataInfoInDmp(index)}
                    sx={{ textTransform: "none" }}
                    disabled={index === 0}
                  />
                  <Button
                    variant="outlined"
                    color="info"
                    children={"Down"}
                    startIcon={<ArrowDownwardOutlined />}
                    onClick={() => moveDownDataInfoInDmp(index)}
                    sx={{ textTransform: "none" }}
                    disabled={index === dmp.dataInfo.length - 1}
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    children={"編集"}
                    startIcon={<EditOutlined />}
                    onClick={() => handleOpen(index)}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    children={"削除"}
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
          {formData.map(({ key, label, required, helperText, placeholder, type, options, selectMultiple, helpChip, minRows }) => (
            <FormControl key={key} fullWidth>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <OurFormLabel label={label} required={required} />
                {helpChip && <HelpChip text={helpChip} />}
              </Box>
              {!selectMultiple ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  error={errors[key] !== null}
                  helperText={errors[key] ?? helperText}
                  placeholder={placeholder}
                  value={getValue(key)}
                  onChange={(e) => updateValue(key, e.target.value)}
                  onBlur={() => updateTouched(key)}
                  type={type === "date" ? "date" : "text"}
                  select={type === "select"}
                  size="small"
                  multiline={minRows !== undefined && minRows > 1}
                  minRows={minRows}
                >
                  {type === "select" &&
                    getOptions(key).map((option) => (
                      <MenuItem key={option} value={option} children={option} />
                    ))}
                </TextField>
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    error={errors[key] !== null}
                    value={currentDataInfo[key]}
                    onChange={(e) => updateValue(key, e.target.value)}
                    onBlur={() => updateTouched(key)}
                    multiple
                    size="small"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                        {(selected as unknown as string[]).map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {options!.map((option) => (
                      <MenuItem key={option} value={option} children={option} />
                    ))}
                  </Select>
                  <FormHelperText error={errors[key] !== null} children={errors[key] ?? helperText} />
                </>
              )}
            </FormControl>
          ))}
        </DialogContent>
        <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
          <Button
            children={updateIndex === -1 ? "追加" : "編集"}
            onClick={addDataInfo}
            variant="contained"
            color="secondary"
            disabled={!isFormValid}
            aria-hidden="true"
          />
          <Button children="キャンセル" onClick={handleClose} variant="outlined" color="secondary" />
        </DialogActions>
      </Dialog>
    </Box>
  )
}
