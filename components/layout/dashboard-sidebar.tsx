"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, CreditCard, DollarSign, Home, LineChart, PieChart, TrendingUp, Upload } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function DashboardSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center px-4 py-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <span className="text-xl font-bold">経営ダッシュボード</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
              <Link href="/dashboard">
                <Home />
                <span>ダッシュボード</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/sales")}>
              <Link href="/sales">
                <TrendingUp />
                <span>売上</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/costs")}>
              <Link href="/costs">
                <CreditCard />
                <span>費用</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profits")}>
              <Link href="/profits">
                <DollarSign />
                <span>利益</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/budgets")}>
              <Link href="/budgets">
                <PieChart />
                <span>予算</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/analysis")}>
              <Link href="/analysis/budget-analysis">
                <LineChart />
                <span>分析</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={isActive("/analysis/budget-analysis")}>
                  <Link href="/analysis/budget-analysis">予実分析</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/import")}>
              <Link href="/import">
                <Upload />
                <span>データインポート</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">Management Dashboard v1.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}
