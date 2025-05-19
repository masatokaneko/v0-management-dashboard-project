"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

interface AchievementChartProps {
  title: string
  data: {
    month: string
    achievement: number
  }[]
  className?: string
}

export function AchievementChart({ title, data, className }: AchievementChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} />
            <Tooltip formatter={(value: number) => [`${value}%`, "達成率"]} labelFormatter={(label) => `${label}月`} />
            <Legend />
            <Bar dataKey="achievement" name="達成率" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.achievement >= 100 ? "#10b981" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
