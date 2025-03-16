import { AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined, DeleteOutline, EditOutlined } from "@mui/icons-material"
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControl, TableContainer, Paper, Table, TableHead, TableCell, TableRow, TableBody, colors, Select, FormHelperText, Chip } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState, useEffect, useRef } from "react"
import { useRecoilState } from "recoil"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { initPersonInfo, PersonInfo, personRole, listingPersonNames, personInfoKeys } from "@/dmp"
import { dmpAtom } from "@/store/dmp"
import { User } from "@/store/user"
import theme from "@/theme"

interface PersonInfoSectionProps {
  sx?: SxProps
  isNew: boolean
  user: User
}

interface FormData {
  key: keyof PersonInfo
  label: string
  required: boolean
  helperText?: string
  type: "text" | "date" | "select"
  options?: string[]
  selectMultiple?: boolean
  helpChip?: React.ReactNode
}

const formData: FormData[] = [
  {
    key: "role",
    label: "役割",
    required: true,
    type: "select",
    options: [...personRole],
    selectMultiple: true,
  },
  {
    key: "lastName",
    label: "性",
    required: true,
    type: "text",
  },
  {
    key: "firstName",
    label: "名",
    required: true,
    type: "text",
  },
  {
    key: "eRadResearcherId",
    label: "e-Rad 研究者番号",
    required: false,
    type: "text",
  },
  {
    key: "orcid",
    label: "ORCID",
    required: false,
    type: "text",
  },
  {
    key: "affiliation",
    label: "所属機関",
    required: true,
    type: "text",
  },
]

const requiredKeys = formData.filter((data) => data.required).map((data) => data.key)

const initErrors = (): Record<keyof PersonInfo, string | null> => {
  return (personInfoKeys).reduce((acc, key) => {
    acc[key] = null
    return acc
  }, {} as Record<keyof PersonInfo, string | null>)
}

const initFormTouchedState = (state = false): Record<keyof PersonInfo, boolean> => {
  return (personInfoKeys).reduce((acc, key) => {
    acc[key] = state
    return acc
  }, {} as Record<keyof PersonInfo, boolean>)
}

export default function PersonInfoSection({ sx, isNew, user }: PersonInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const [open, setOpen] = useState(false)
  const [currentPersonInfo, setCurrentPersonInfo] = useState<PersonInfo>(initPersonInfo())
  const [touched, setTouched] = useState(initFormTouchedState(false))
  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const initRef = useRef(false)
  const existsPersonNames = listingPersonNames(dmp)
  const [appendTrigger, setAppendTrigger] = useState(false)

  const validate = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]): string | null => {
    if (requiredKeys.includes(key))
      if (Array.isArray(value) && value.length === 0) return "必須項目です"
      else if (value === "") return "必須項目です"
    return null
  }

  const errors = (() => {
    const errors = initErrors()
    for (const key of personInfoKeys) {
      if (!touched[key]) continue
      errors[key] = validate(key, currentPersonInfo[key])
    }
    return errors
  })()
  const isFormValid = Object.values(errors).every((value) => value === null)

  const updateValue = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]) => {
    setCurrentPersonInfo((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateTouched = (key: keyof PersonInfo) => {
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }))
  }

  const handleOpen = (index = -1) => {
    if (index !== -1) {
      setCurrentPersonInfo(dmp.personInfo[index])
    } else {
      setCurrentPersonInfo(initPersonInfo())
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
      if (!existsPersonNames.includes(`${user.familyName} ${user.givenName}`.trim())) {
        appendPersonInfoToDmp({
          role: ["研究代表者"],
          lastName: user.familyName,
          firstName: user.givenName,
          eRadResearcherId: user.researcherId ?? undefined,
          orcid: user.orcid ?? undefined,
          affiliation: user.affiliation ?? "",
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const appendPersonInfoToDmp = (personInfo: PersonInfo) => {
    setDmp((prev) => ({
      ...prev,
      personInfo: [...prev.personInfo, personInfo],
    }))
  }

  const updatePersonInfoToDmp = (index: number, personInfo: PersonInfo) => {
    setDmp((prev) => ({
      ...prev,
      personInfo: prev.personInfo.map((p, i) => i === index ? personInfo : p),
    }))
  }

  const removePersonInfoFromDmp = (index: number) => {
    setDmp((prev) => ({
      ...prev,
      personInfo: prev.personInfo.filter((_, i) => i !== index),
    }))
  }

  const moveUpPersonInfoInDmp = (index: number) => {
    if (index === 0) return
    setDmp((prev) => {
      const personInfo = [...prev.personInfo]
      const tmp = personInfo[index]
      personInfo[index] = personInfo[index - 1]
      personInfo[index - 1] = tmp
      return {
        ...prev,
        personInfo,
      }
    })
  }

  const moveDownPersonInfoInDmp = (index: number) => {
    if (index === dmp.personInfo.length - 1) return
    setDmp((prev) => {
      const personInfo = [...prev.personInfo]
      const tmp = personInfo[index]
      personInfo[index] = personInfo[index + 1]
      personInfo[index + 1] = tmp
      return {
        ...prev,
        personInfo,
      }
    })
  }

  const addPersonInfo = () => {
    setTouched(initFormTouchedState(true))
    setAppendTrigger(true)
  }

  useEffect(() => {
    // Use useEffect to re-evaluate the form validation (isFormValid) when appendTrigger changes
    if (!appendTrigger) return

    if (isFormValid) {
      if (updateIndex === -1) {
        appendPersonInfoToDmp(currentPersonInfo)
      } else {
        updatePersonInfoToDmp(updateIndex, currentPersonInfo)
      }
      setOpen(false)
      setUpdateIndex(-1)
    }
    setAppendTrigger(false)
  }, [appendTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="担当者情報" />
      <TableContainer component={Paper} variant="outlined" sx={{
        borderBottom: "none",
        mt: "1rem",
        width: "100%",
        overflowX: "auto",
      }}>
        <Table sx={{ minWidth: theme.breakpoints.values.md }}>
          <TableHead sx={{ backgroundColor: colors.grey[100] }}>
            <TableRow>
              {["役割", "名前", "e-Rad 研究者番号", "ORCID", "所属機関", ""].map((header, index) => (
                <TableCell
                  key={index}
                  children={header}
                  sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dmp.personInfo.map((personInfo, index) => (
              <TableRow key={index}>
                <TableCell children={personInfo.role.join(", ")} sx={{ p: "0.5rem 1rem" }} />
                <TableCell children={`${personInfo.lastName} ${personInfo.firstName}`} sx={{ p: "0.5rem 1rem" }} />
                <TableCell children={personInfo.eRadResearcherId ?? ""} sx={{ p: "0.5rem 1rem" }} />
                <TableCell children={personInfo.orcid ?? ""} sx={{ p: "0.5rem 1rem" }} />
                <TableCell children={personInfo.affiliation} sx={{ p: "0.5rem 1rem" }} />
                <TableCell sx={{ display: "flex", flexDirection: "row", gap: "1rem", p: "0.5rem 1rem", justifyContent: "flex-end" }} align="right">
                  <Button
                    variant="outlined"
                    color="info"
                    children={"Up"}
                    startIcon={<ArrowUpwardOutlined />}
                    onClick={() => moveUpPersonInfoInDmp(index)}
                    sx={{ textTransform: "none" }}
                    disabled={index === 0}
                  />
                  <Button
                    variant="outlined"
                    color="info"
                    children={"Down"}
                    startIcon={<ArrowDownwardOutlined />}
                    onClick={() => moveDownPersonInfoInDmp(index)}
                    sx={{ textTransform: "none" }}
                    disabled={index === dmp.personInfo.length - 1}
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
                    onClick={() => removePersonInfoFromDmp(index)}
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
        children="担当者を追加する"
        startIcon={<AddOutlined />}
      />

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle
          children={updateIndex === -1 ? "担当者の追加" : "担当者の編集"}
          sx={{ mt: "0.5rem", mx: "1rem" }}
        />
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "0.5rem", mx: "1rem" }}>
          {formData.map(({ key, label, required, helperText, type, options, selectMultiple, helpChip }) => (
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
                  value={currentPersonInfo[key] ?? ""}
                  onChange={(e) => updateValue(key, e.target.value)}
                  onBlur={() => updateTouched(key)}
                  type={type === "date" ? "date" : "text"}
                  select={type === "select"}
                  size="small"
                >
                  {type === "select" &&
                    options!.map((option) => (
                      <MenuItem key={option} value={option} children={option} />
                    ))}
                </TextField>
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    error={errors[key] !== null}
                    value={currentPersonInfo[key]}
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
            onClick={addPersonInfo}
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
