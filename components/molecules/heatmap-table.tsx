"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeatmapData {
  month: string
  salesAchievement: number
  costsAchievement: number
  profitAchievement: number
}

interface HeatmapTableProps {
  title: string
  data: HeatmapData[]
  className?: string
}

export function HeatmapTable({ title, data, className }: HeatmapTableProps) {
  const getHeatmapColor = (value: number, isReversed = false) => {
    if (isReversed) {
      // For costs, lower is better
      if (value <= 80) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
      if (value <= 95) return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
      if (value <= 105) return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400"
      if (value <= 120) return "bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
      return "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
    } else {
      // For sales and profit, higher is better
      if (value >= 120) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
      if (value >= 105) return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
      if (value >= 95) return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400"
      if (value >= 80) return "bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
      return "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
    }
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
                <TableHead className="text-center">売上達成率</TableHead>
                <TableHead className="text-center">費用消化率</TableHead>
                <TableHead className="text-center">利益達成率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className={cn("text-center font-medium", getHeatmapColor(row.salesAchievement))}>
                    {row.salesAchievement.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn("text-center font-medium", getHeatmapColor(row.costsAchievement, true))}>
                    {row.costsAchievement.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn("text-center font-medium", getHeatmapColor(row.profitAchievement))}>
                    {row.profitAchievement.toFixed(1)}%
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
