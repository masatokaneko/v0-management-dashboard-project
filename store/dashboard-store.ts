import { create } from "zustand"

// 仮のデータ型定義
export interface MonthlyData {
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
  contractSales: number
  monthlySales: number
}

interface DashboardState {
  monthlyData: MonthlyData[]
  isLoading: boolean
  error: string | null
  fetchData: () => Promise<void>
}

// 仮のデータ
const mockMonthlyData: MonthlyData[] = [
  {
    month: "4",
    actualSales: 85000000,
    budgetSales: 80000000,
    salesAchievement: 106.3,
    actualCosts: 65000000,
    budgetCosts: 60000000,
    costsAchievement: 108.3,
    actualProfit: 20000000,
    budgetProfit: 20000000,
    profitAchievement: 100.0,
    contractSales: 90000000,
    monthlySales: 85000000,
  },
  {
    month: "5",
    actualSales: 82000000,
    budgetSales: 85000000,
    salesAchievement: 96.5,
    actualCosts: 62000000,
    budgetCosts: 65000000,
    costsAchievement: 95.4,
    actualProfit: 20000000,
    budgetProfit: 20000000,
    profitAchievement: 100.0,
    contractSales: 85000000,
    monthlySales: 82000000,
  },
  {
    month: "6",
    actualSales: 90000000,
    budgetSales: 85000000,
    salesAchievement: 105.9,
    actualCosts: 67000000,
    budgetCosts: 65000000,
    costsAchievement: 103.1,
    actualProfit: 23000000,
    budgetProfit: 20000000,
    profitAchievement: 115.0,
    contractSales: 95000000,
    monthlySales: 90000000,
  },
  {
    month: "7",
    actualSales: 88000000,
    budgetSales: 90000000,
    salesAchievement: 97.8,
    actualCosts: 70000000,
    budgetCosts: 68000000,
    costsAchievement: 102.9,
    actualProfit: 18000000,
    budgetProfit: 22000000,
    profitAchievement: 81.8,
    contractSales: 92000000,
    monthlySales: 88000000,
  },
  {
    month: "8",
    actualSales: 95000000,
    budgetSales: 90000000,
    salesAchievement: 105.6,
    actualCosts: 71000000,
    budgetCosts: 68000000,
    costsAchievement: 104.4,
    actualProfit: 24000000,
    budgetProfit: 22000000,
    profitAchievement: 109.1,
    contractSales: 100000000,
    monthlySales: 95000000,
  },
  {
    month: "9",
    actualSales: 92000000,
    budgetSales: 95000000,
    salesAchievement: 96.8,
    actualCosts: 70000000,
    budgetCosts: 72000000,
    costsAchievement: 97.2,
    actualProfit: 22000000,
    budgetProfit: 23000000,
    profitAchievement: 95.7,
    contractSales: 95000000,
    monthlySales: 92000000,
  },
  {
    month: "10",
    actualSales: 100000000,
    budgetSales: 95000000,
    salesAchievement: 105.3,
    actualCosts: 75000000,
    budgetCosts: 72000000,
    costsAchievement: 104.2,
    actualProfit: 25000000,
    budgetProfit: 23000000,
    profitAchievement: 108.7,
    contractSales: 105000000,
    monthlySales: 100000000,
  },
  {
    month: "11",
    actualSales: 98000000,
    budgetSales: 100000000,
    salesAchievement: 98.0,
    actualCosts: 74000000,
    budgetCosts: 75000000,
    costsAchievement: 98.7,
    actualProfit: 24000000,
    budgetProfit: 25000000,
    profitAchievement: 96.0,
    contractSales: 102000000,
    monthlySales: 98000000,
  },
  {
    month: "12",
    actualSales: 105000000,
    budgetSales: 100000000,
    salesAchievement: 105.0,
    actualCosts: 78000000,
    budgetCosts: 75000000,
    costsAchievement: 104.0,
    actualProfit: 27000000,
    budgetProfit: 25000000,
    profitAchievement: 108.0,
    contractSales: 110000000,
    monthlySales: 105000000,
  },
  {
    month: "1",
    actualSales: 95000000,
    budgetSales: 95000000,
    salesAchievement: 100.0,
    actualCosts: 72000000,
    budgetCosts: 72000000,
    costsAchievement: 100.0,
    actualProfit: 23000000,
    budgetProfit: 23000000,
    profitAchievement: 100.0,
    contractSales: 98000000,
    monthlySales: 95000000,
  },
  {
    month: "2",
    actualSales: 100000000,
    budgetSales: 95000000,
    salesAchievement: 105.3,
    actualCosts: 75000000,
    budgetCosts: 72000000,
    costsAchievement: 104.2,
    actualProfit: 25000000,
    budgetProfit: 23000000,
    profitAchievement: 108.7,
    contractSales: 105000000,
    monthlySales: 100000000,
  },
  {
    month: "3",
    actualSales: 110000000,
    budgetSales: 100000000,
    salesAchievement: 110.0,
    actualCosts: 80000000,
    budgetCosts: 75000000,
    costsAchievement: 106.7,
    actualProfit: 30000000,
    budgetProfit: 25000000,
    profitAchievement: 120.0,
    contractSales: 115000000,
    monthlySales: 110000000,
  },
]

export const useDashboardStore = create<DashboardState>((set) => ({
  monthlyData: [],
  isLoading: false,
  error: null,
  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      // 実際のAPIリクエストの代わりに、モックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 500))
      set({ monthlyData: mockMonthlyData, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      })
    }
  },
}))
