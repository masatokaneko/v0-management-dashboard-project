"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "@/components/ui/chart"

interface SalesTrendChartProps {
  title: string
  data: {
    month: string
    actual: number
    budget: number
  }[]
  className?: string
  yAxisFormatter?: (value: number) => string
}

export function SalesTrendChart({
  title,
  data,
  className,
  yAxisFormatter = (value) => `${(value / 1000000).toFixed(0)}M`,
}: SalesTrendChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={yAxisFormatter} />
            <Tooltip
              formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M円`, ""]}
              labelFormatter={(label) => `${label}月`}
            />
            <Legend />
            <Bar dataKey="actual" name="実績" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="budget" name="予算" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
