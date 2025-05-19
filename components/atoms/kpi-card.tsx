import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, change, changeLabel = "前年同期比", icon, className }: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-2 flex items-center text-xs">
          {change > 0 ? (
            <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-500" />
          ) : (
            <ArrowDownIcon className="mr-1 h-4 w-4 text-rose-500" />
          )}
          <span className={cn(change > 0 ? "text-emerald-500" : "text-rose-500", "font-medium")}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1 text-muted-foreground">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
