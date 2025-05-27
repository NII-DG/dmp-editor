import { TextField, Button, Box } from "@mui/material"
import { useForm, Controller } from "react-hook-form"

interface FormData {
  sampleField: string
}

export default function SimpleFormExample() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      sampleField: "",
    },
  })

  const onSubmit = (data: FormData) => {
    console.log("Submitted data:", data)
    alert(JSON.stringify(data, null, 2))
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2, width: "300px" }}>
      <Controller
        name="sampleField"
        control={control}
        rules={{ required: "このフィールドは必須です" }}
        render={({ field }) => (
          <TextField
            {...field}
            label="サンプル入力"
            error={!!errors.sampleField}
            helperText={errors.sampleField?.message}
            size="small"
          />
        )}
      />
      <Button type="submit" variant="contained">
        送信
      </Button>
    </Box>
  )
}
