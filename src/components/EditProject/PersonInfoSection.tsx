import { AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined, DeleteOutline, EditOutlined } from "@mui/icons-material"
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, Chip, TableContainer, Paper, Table, TableHead, TableCell, TableRow, TableBody, colors } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState, useEffect, useRef } from "react"
import { useRecoilState } from "recoil"

import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { initPersonInfo, PersonInfo, PersonRole, personRole, listingPersonNames } from "@/dmp"
import { dmpAtom } from "@/store/dmp"
import { User } from "@/store/user"

interface PersonInfoSectionProps {
  sx?: SxProps
  isNew: boolean
  user: User
}

const initError = (): Record<keyof PersonInfo, string | null> => ({
  role: null,
  lastName: null,
  firstName: null,
  eRadResearcherId: null,
  orcid: null,
  affiliation: null,
})

export default function PersonInfoSection({ sx, isNew, user }: PersonInfoSectionProps) {
  const [dmp, setDmp] = useRecoilState(dmpAtom)
  const [open, setOpen] = useState(false)
  const [currentPersonInfo, setCurrentPersonInfo] = useState<PersonInfo>(initPersonInfo)
  const [error, setError] = useState<Record<keyof PersonInfo, string | null>>(initError())
  const [addRequested, setAddRequested] = useState(false)
  const isFormValid = Object.values(error).every((value) => value === null)
  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const initRef = useRef(false)
  const existsPersonNames = listingPersonNames(dmp)

  const handleOpen = (index = -1) => {
    if (index !== -1) {
      setCurrentPersonInfo(dmp.personInfo[index])
    } else {
      setCurrentPersonInfo(initPersonInfo)
    }
    setError(initError())
    setOpen(true)
    setUpdateIndex(index)
  }
  const handleClose = () => {
    setOpen(false)
    setUpdateIndex(-1)
  }

  const updateCurrentPersonInfo = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]) => {
    setCurrentPersonInfo((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateError = <K extends keyof PersonInfo>(key: K, value: string | null) => {
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

  const REQUIRED_KEYS: (keyof PersonInfo)[] = ["role", "lastName", "firstName", "affiliation"] as const

  const validateValue = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]): void => {
    if (REQUIRED_KEYS.includes(key)) {
      if ((Array.isArray(value) && value.length === 0) || value === "") {
        updateError(key, "必須項目です")
        return
      }
    }

    updateError(key, null)
  }

  const changeCurrentValue = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]) => {
    updateCurrentPersonInfo(key, value)
    validateValue(key, value)
  }

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
    Object.entries(currentPersonInfo)
      .forEach(([key, value]) => validateValue(key as keyof PersonInfo, value))
    setAddRequested(true)
  }

  useEffect(() => {
    if (!addRequested) return
    if (!isFormValid) return

    if (updateIndex === -1) {
      appendPersonInfoToDmp(currentPersonInfo)
    } else {
      updatePersonInfoToDmp(updateIndex, currentPersonInfo)
    }

    setAddRequested(false)
    setOpen(false)
    setUpdateIndex(-1)
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ ...sx, display: "flex", flexDirection: "column" }}>
      <SectionHeader text="担当者情報" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: "none", mt: "1rem" }}>
          <Table>
            <TableHead sx={{ backgroundColor: colors.grey[100] }}>
              <TableRow>
                <TableCell children="役割" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="名前" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="e-Rad 研究者番号" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="ORCID" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="所属機関" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
                <TableCell children="" sx={{ fontWeight: "bold", textAlign: "center", p: "0.5rem 1rem" }} />
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
                      children="Up"
                      startIcon={<ArrowUpwardOutlined />}
                      onClick={() => moveUpPersonInfoInDmp(index)}
                      sx={{ textTransform: "none" }}
                      disabled={index === 0}
                    />
                    <Button
                      variant="outlined"
                      color="info"
                      children="Down"
                      startIcon={<ArrowDownwardOutlined />}
                      onClick={() => moveDownPersonInfoInDmp(index)}
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
            <FormControl fullWidth>
              <OurFormLabel label="役割" required />
              <Select
                variant="outlined"
                multiple
                value={currentPersonInfo.role}
                onChange={(e) => changeCurrentValue("role", e.target.value as PersonRole[])}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                error={!!error.role}
              >
                {personRole.map((role) => (
                  <MenuItem key={role} value={role} children={role} />
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="性" required />
              <TextField
                variant="outlined"
                value={currentPersonInfo.lastName}
                onChange={(e) => changeCurrentValue("lastName", e.target.value)}
                error={!!error.lastName}
                helperText={error.lastName}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="名" required />
              <TextField
                variant="outlined"
                value={currentPersonInfo.firstName}
                onChange={(e) => changeCurrentValue("firstName", e.target.value)}
                error={!!error.firstName}
                helperText={error.firstName}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="e-Rad研究者番号" />
              <TextField
                variant="outlined"
                value={currentPersonInfo.eRadResearcherId}
                onChange={(e) => changeCurrentValue("eRadResearcherId", e.target.value)}
                error={!!error.eRadResearcherId}
                helperText={error.eRadResearcherId}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="ORCID" />
              <TextField
                variant="outlined"
                value={currentPersonInfo.orcid}
                onChange={(e) => changeCurrentValue("orcid", e.target.value)}
                error={!!error.orcid}
                helperText={error.orcid}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <OurFormLabel label="所属機関" required />
              <TextField
                variant="outlined"
                value={currentPersonInfo.affiliation}
                onChange={(e) => changeCurrentValue("affiliation", e.target.value)}
                error={!!error.affiliation}
                helperText={error.affiliation}
                sx={{ maxWidth: "480px" }}
                size="small"
                fullWidth
              />
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
            <Button
              children={updateIndex === -1 ? "追加" : "編集"}
              onClick={addPersonInfo}
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
