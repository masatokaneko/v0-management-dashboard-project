import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PercentageBadgeProps {
  value: number
  threshold?: number
  reverseColors?: boolean
  className?: string
}

export function PercentageBadge({ value, threshold = 100, reverseColors = false, className }: PercentageBadgeProps) {
  const isPositive = reverseColors ? value < threshold : value >= threshold

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        isPositive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
        className,
      )}
    >
      {value.toFixed(1)}%
    </Badge>
  )
}
