import { AddOutlined, EditOutlined, DeleteOutline, ArrowUpwardOutlined, ArrowDownwardOutlined } from "@mui/icons-material"
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, Chip, Select, TableContainer, Paper, Table, TableHead, TableCell, TableRow, TableBody, colors, FormHelperText } from "@mui/material"
import { SxProps } from "@mui/system"
import { useState } from "react"
import { useFormContext, useFieldArray, Controller, useForm, FormProvider, useFormState } from "react-hook-form"

import HelpChip from "@/components/EditProject/HelpChip"
import OurFormLabel from "@/components/EditProject/OurFormLabel"
import SectionHeader from "@/components/EditProject/SectionHeader"
import { initPersonInfo, personRole, PersonInfo, DmpFormValues } from "@/dmp"
import theme from "@/theme"

interface FormData {
  key: keyof PersonInfo
  label: string
  required: boolean
  type: "text" | "date" | "select"
  options?: string[]
  selectMultiple?: boolean
  helperText?: string
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

interface PersonInfoSectionProps {
  sx?: SxProps
}

export default function PersonInfoSection({ sx }: PersonInfoSectionProps) {
  const { control } = useFormContext<DmpFormValues>()
  const { fields, append, remove, move, update } = useFieldArray<DmpFormValues, "dmp.personInfo">({
    control,
    name: "dmp.personInfo",
  })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const dialogMethods = useForm<PersonInfo>({
    defaultValues: initPersonInfo(),
    mode: "onBlur",
    reValidateMode: "onBlur",
  })
  const { isValid, isSubmitted } = useFormState({
    control: dialogMethods.control,
  })

  const handleOpen = (index: number) => {
    if (index === fields.length) {
      dialogMethods.reset(initPersonInfo())
    } else {
      dialogMethods.reset(fields[index] as PersonInfo)
    }
    setOpenIndex(index)
  }

  const handleClose = () => setOpenIndex(null)

  const handleDialogSubmit = (data: PersonInfo) => {
    if (openIndex === null) return
    if (openIndex === fields.length) {
      append(data)
    } else {
      update(openIndex, data)
    }
    handleClose()
  }

  const getValue = <K extends keyof PersonInfo>(key: K): PersonInfo[K] => {
    const value = dialogMethods.getValues(key)
    if (value === undefined || value === null) {
      return "" as PersonInfo[K]
    }
    return value
  }

  const updateValue = <K extends keyof PersonInfo>(key: K, value: PersonInfo[K]) => {
    let newValue: PersonInfo[K] = value
    if (newValue === "") {
      newValue = undefined as PersonInfo[K]
    }
    dialogMethods.setValue(key, newValue as never)
  }

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
            {fields.map((personInfo, index) => (
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
                    onClick={() => move(index, index - 1)}
                    sx={{ textTransform: "none" }}
                    disabled={index === 0}
                  />
                  <Button
                    variant="outlined"
                    color="info"
                    children={"Down"}
                    startIcon={<ArrowDownwardOutlined />}
                    onClick={() => move(index, index + 1)}
                    sx={{ textTransform: "none" }}
                    disabled={index === fields.length - 1}
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
                    onClick={() => remove(index)}
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
        onClick={() => handleOpen(fields.length)} sx={{ width: "180px", mt: "1rem" }}
        children="担当者を追加する"
        startIcon={<AddOutlined />}
      />

      <Dialog
        open={openIndex !== null}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        closeAfterTransition={false}
      >
        <FormProvider {...dialogMethods}>
          <DialogTitle
            children={openIndex === fields.length ? "担当者の追加" : "担当者の編集"}
            sx={{ mt: "0.5rem", mx: "1rem" }}
          />
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem", mt: "0.5rem", mx: "1rem" }}>
            {openIndex !== null && formData.map(({ key, label, required, helperText, type, options, selectMultiple, helpChip }) => (
              <Controller
                key={key}
                name={key}
                control={dialogMethods.control}
                rules={required ? { required: `${label} は必須です` } : {}}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth>
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                      <OurFormLabel label={label} required={required} />
                      {helpChip && <HelpChip text={helpChip} />}
                    </Box>
                    {!selectMultiple ? (
                      <TextField
                        {...field}
                        fullWidth
                        variant="outlined"
                        error={!!error}
                        helperText={error?.message ?? helperText}
                        value={getValue(key)}
                        onChange={(e) => updateValue(key, e.target.value)}
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
                          {...field}
                          value={field.value ?? []}
                          fullWidth
                          variant="outlined"
                          error={!!error}
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
                        <FormHelperText error={!!error} children={error?.message ?? helperText} />
                      </>
                    )}
                  </FormControl>
                )}
              />
            ))}
          </DialogContent>
          <DialogActions sx={{ m: "0.5rem 1.5rem 1.5rem" }}>
            <Button children="キャンセル" onClick={handleClose} variant="outlined" color="secondary" />
            <Button
              type="submit"
              children={openIndex === fields.length ? "追加" : "編集"}
              variant="contained"
              color="secondary"
              disabled={isSubmitted && !isValid}
              onClick={dialogMethods.handleSubmit(handleDialogSubmit)}
            />
          </DialogActions>
        </FormProvider>
      </Dialog>
    </Box>
  )
}
