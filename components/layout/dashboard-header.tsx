"use client"

import { usePathname } from "next/navigation"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "next-themes"

export function DashboardHeader() {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "ダッシュボード"
    if (pathname === "/sales") return "売上"
    if (pathname === "/costs") return "費用"
    if (pathname === "/profits") return "利益"
    if (pathname === "/budgets") return "予算"
    if (pathname === "/analysis/budget-analysis") return "予実分析"
    if (pathname === "/import") return "データインポート"
    return "経営ダッシュボード"
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
