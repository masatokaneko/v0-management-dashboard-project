"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PercentageBadge } from "@/components/atoms/percentage-badge"

interface BudgetComparisonData {
  month: string
  actualSales: number
  budgetSales: number
  salesAchievement: number
  actualCosts: number
  budgetCosts: number
  costsAchievement: number
  actualProfit: number
  budgetProfit: number
  profitAchievement: number
}

interface BudgetComparisonTableProps {
  title: string
  data: BudgetComparisonData[]
  className?: string
}

export function BudgetComparisonTable({ title, data, className }: BudgetComparisonTableProps) {
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
                <TableHead rowSpan={2}>月</TableHead>
                <TableHead colSpan={3} className="text-center">
                  売上
                </TableHead>
                <TableHead colSpan={3} className="text-center">
                  費用
                </TableHead>
                <TableHead colSpan={3} className="text-center">
                  利益
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead>実績</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>達成率</TableHead>
                <TableHead>実績</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>消化率</TableHead>
                <TableHead>実績</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>達成率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.actualSales)}</TableCell>
                  <TableCell>{formatCurrency(row.budgetSales)}</TableCell>
                  <TableCell>
                    <PercentageBadge value={row.salesAchievement} />
                  </TableCell>
                  <TableCell>{formatCurrency(row.actualCosts)}</TableCell>
                  <TableCell>{formatCurrency(row.budgetCosts)}</TableCell>
                  <TableCell>
                    <PercentageBadge value={row.costsAchievement} reverseColors={true} />
                  </TableCell>
                  <TableCell>{formatCurrency(row.actualProfit)}</TableCell>
                  <TableCell>{formatCurrency(row.budgetProfit)}</TableCell>
                  <TableCell>
                    <PercentageBadge value={row.profitAchievement} />
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
