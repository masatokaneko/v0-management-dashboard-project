"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PercentageBadge } from "@/components/atoms/percentage-badge"

interface SalesData {
  month: string
  contractSales: number
  monthlySales: number
  budgetSales: number
  achievement: number
}

interface SalesTableProps {
  title: string
  data: SalesData[]
  className?: string
}

export function SalesTable({ title, data, className }: SalesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>月</TableHead>
                <TableHead>契約獲得</TableHead>
                <TableHead>月次按分</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>達成率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.contractSales)}</TableCell>
                  <TableCell>{formatCurrency(row.monthlySales)}</TableCell>
                  <TableCell>{formatCurrency(row.budgetSales)}</TableCell>
                  <TableCell>
                    <PercentageBadge value={row.achievement} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
