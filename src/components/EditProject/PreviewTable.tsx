import { TableContainer, Paper, Table, TableBody, TableRow, TableCell } from "@mui/material"
import { SxProps } from "@mui/system"

interface PreviewTableProps {
  sx?: SxProps
  data: string[][]
}

export default function PreviewTable({ sx, data }: PreviewTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ ...sx }}>
      <Table size="small">
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
