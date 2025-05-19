# トランザクション管理方針

## トランザクション境界の定義

本プロジェクトでは、データの整合性を確保するために、明確なトランザクション境界を定義します。

### トランザクション境界の原則

1. **単一責任の原則**: 各トランザクションは単一の論理的な操作に対応する
2. **最小スコープの原則**: トランザクションの範囲は必要最小限に保つ
3. **明示的な境界**: トランザクションの開始と終了は明示的に定義する

### トランザクション境界の実装

#### バックエンド（API）でのトランザクション

\`\`\`typescript
// services/budget-service.ts
import { db } from '../database';

export async function updateBudget(budgetData: BudgetUpdateData): Promise<Budget> {
  // トランザクションの開始
  const result = await db.transaction(async (trx) => {
    // 1. 既存の予算データを取得
    const existingBudget = await trx('budgets')
      .where({ id: budgetData.id })
      .first();
      
    if (!existingBudget) {
      throw new Error('Budget not found');
    }
    
    // 2. 予算データを更新
    const [updatedBudget] = await trx('budgets')
      .where({ id: budgetData.id })
      .update({
        amount: budgetData.amount,
        updatedAt: new Date(),
      })
      .returning('*');
      
    // 3. 予算履歴を記録
    await trx('budget_history').insert({
      budgetId: budgetData.id,
      previousAmount: existingBudget.amount,
      newAmount: budgetData.amount,
      updatedBy: budgetData.userId,
      updatedAt: new Date(),
    });
    
    // 4. 関連する予算達成率を再計算
    await trx.raw(`
      UPDATE achievement_rates
      SET rate = (actual_amount / ${budgetData.amount}) * 100
      WHERE budget_id = ?
    `, [budgetData.id]);
    
    return updatedBudget;
  });
  
  return result;
}
\`\`\`

#### フロントエンド（クライアント）でのトランザクション

フロントエンドでは、複数のAPIリクエストを論理的なトランザクションとして扱います。

\`\`\`typescript
// hooks/use-budget-update.ts
import { useState } from 'react';
import { updateBudget, recalculateAchievement, notifyStakeholders } from '@/api/budget';

export function useBudgetUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const executeBudgetUpdate = async (budgetData: BudgetUpdateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 論理的なトランザクションの開始
      // 1. 予算データを更新
      const updatedBudget = await updateBudget(budgetData);
      
      // 2. 達成率の再計算をリクエスト
      await recalculateAchievement(updatedBudget.id);
      
      // 3. 関係者に通知
      await notifyStakeholders({
        budgetId: updatedBudget.id,
        action: 'update',
        details: `Budget updated to ${updatedBudget.amount}`,
      });
      
      return updatedBudget;
    } catch (err) {
      // エラーハンドリング
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    executeBudgetUpdate,
    isLoading,
    error,
  };
}
\`\`\`

### トランザクション境界の文書化

各サービスやAPIエンドポイントのトランザクション境界を明確に文書化します。

\`\`\`typescript
/**
 * 予算データを更新し、関連する達成率を再計算します。
 * 
 * トランザクション境界:
 * - 予算テーブルの更新
 * - 予算履歴の記録
 * - 達成率の再計算
 * 
 * @param budgetData 更新する予算データ
 * @returns 更新された予算データ
 * @throws {Error} 予算が見つからない場合、または更新に失敗した場合
 */
export async function updateBudget(budgetData: BudgetUpdateData): Promise<Budget> {
  // 実装...
}
\`\`\`

## 冪等性とロールバック戦略

システムの信頼性を高めるために、冪等性（同じ操作を複数回実行しても結果が変わらない性質）とロールバック戦略を定義します。

### 冪等性の実装

#### 1. 冪等キーの使用

API操作に一意のリクエストIDを付与し、同じリクエストが複数回送信された場合に重複処理を防止します。

\`\`\`typescript
// api/budget-controller.ts
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { budgetService } from '../services';
import { redisClient } from '../redis';

export async function updateBudget(req: Request, res: Response) {
  const { budgetData } = req.body;
  
  // リクエストヘッダーから冪等キーを取得、なければ生成
  const idempotencyKey = req.headers['idempotency-key'] as string || uuidv4();
  
  try {
    // 既に処理済みのリクエストかチェック
    const cachedResult = await redisClient.get(`idempotency:${idempotencyKey}`);
    if (cachedResult) {
      // 既に処理済みの場合は、キャッシュされた結果を返す
      return res.status(200).json(JSON.parse(cachedResult));
    }
    
    // 新規リクエストの処理
    const result = await budgetService.updateBudget(budgetData);
    
    // 結果をキャッシュ（24時間有効）
    await redisClient.set(
      `idempotency:${idempotencyKey}`,
      JSON.stringify(result),
      'EX',
      86400
    );
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
\`\`\`

#### 2. 条件付き更新

データの現在の状態に基づいて更新を条件付きで実行します。

\`\`\`typescript
// services/sales-service.ts
export async function updateSalesData(salesData: SalesUpdateData): Promise<Sales> {
  return await db.transaction(async (trx) => {
    // 現在のバージョンを取得
    const currentData = await trx('sales')
      .where({ id: salesData.id })
      .first();
      
    if (!currentData) {
      throw new Error('Sales data not found');
    }
    
    // バージョンチェック（楽観的ロック）
    if (currentData.version !== salesData.version) {
      throw new Error('Data has been modified by another user');
    }
    
    // バージョンをインクリメントして更新
    const [updatedSales] = await trx('sales')
      .where({ 
        id: salesData.id,
        version: salesData.version // 条件付き更新
      })
      .update({
        amount: salesData.amount,
        updatedAt: new Date(),
        version: salesData.version + 1 // バージョンをインクリメント
      })
      .returning('*');
      
    return updatedSales;
  });
}
\`\`\`

### ロールバック戦略

#### 1. データベーストランザクションのロールバック

データベース操作でエラーが発生した場合、トランザクション全体を自動的にロールバックします。

\`\`\`typescript
// services/cost-service.ts
export async function updateCostData(costData: CostUpdateData): Promise<Cost> {
  try {
    return await db.transaction(async (trx) => {
      // トランザクション内の操作
      // エラーが発生した場合、自動的にロールバックされる
    });
  } catch (error) {
    // エラーログ記録
    logger.error('Failed to update cost data', {
      costId: costData.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // エラーを上位に伝播
    throw error;
  }
}
\`\`\`

#### 2. 補償トランザクション（Compensating Transaction）

複数のサービスにまたがる操作で、一部が失敗した場合に実行済みの操作を取り消す補償トランザクションを実装します。

\`\`\`typescript
// services/report-service.ts
export async function generateMonthlyReport(month: string, year: number): Promise<Report> {
  // 1. レポートメタデータを作成
  let reportId: string | null = null;
  try {
    const report = await reportRepository.createReport({
      type: 'monthly',
      month,
      year,
      status: 'processing',
    });
    reportId = report.id;
    
    // 2. 売上データを集計
    const salesData = await salesService.aggregateMonthlySales(month, year);
    
    // 3. 費用データを集計
    const costsData = await costsService.aggregateMonthlyCosts(month, year);
    
    // 4. レポートデータを生成
    const reportData = generateReportData(salesData, costsData);
    
    // 5. レポートを完成状態に更新
    const finalReport = await reportRepository.updateReport(reportId, {
      data: reportData,
      status: 'completed',
    });
    
    return finalReport;
  } catch (error) {
    // エラーが発生した場合、補償トランザクションを実行
    if (reportId) {
      try {
        // レポートを失敗状態に更新（ロールバック）
        await reportRepository.updateReport(reportId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (compensationError) {
        // 補償トランザクション自体が失敗した場合のログ記録
        logger.error('Compensation transaction failed', {
          reportId,
          originalError: error,
          compensationError,
        });
      }
    }
    
    // エラーを上位に伝播
    throw error;
  }
}
\`\`\`

## 分散トランザクションの可否

本プロジェクトでは、マイクロサービスアーキテクチャを採用しない初期段階では、真の分散トランザクションは避け、代わりに以下のアプローチを採用します。

### 分散トランザクションの代替アプローチ

#### 1. 最終的一貫性（Eventual Consistency）

即時の一貫性ではなく、システムが最終的に一貫した状態に収束することを許容します。

\`\`\`typescript
// services/dashboard-service.ts
export async function refreshDashboardData(): Promise<void> {
  // 非同期で各データソースを更新
  // 即時の一貫性は保証されないが、最終的には一貫した状態になる
  
  // 1. 売上データの更新をキューに入れる
  await messageQueue.publish('sales.refresh', { timestamp: new Date() });
  
  // 2. 費用データの更新をキューに入れる
  await messageQueue.publish('costs.refresh', { timestamp: new Date() });
  
  // 3. 利益データの更新をキューに入れる
  await messageQueue.publish('profits.refresh', { timestamp: new Date() });
  
  // 4. ダッシュボードのキャッシュを無効化
  await cacheService.invalidate('dashboard:summary');
}
\`\`\`

#### 2. サガパターン（Saga Pattern）

複数のサービスにまたがるトランザクションを、一連の独立したローカルトランザクションとして実装し、各ステップで補償トランザクションを定義します。

\`\`\`typescript
// sagas/budget-approval-saga.ts
export async function executeBudgetApprovalSaga(budgetId: string, approverId: string): Promise<void> {
  const saga = new Saga();
  
  // 1. 予算の状態を「承認中」に更新
  saga.addStep({
    execute: async () => {
      await budgetService.updateBudgetStatus(budgetId, 'approving');
    },
    compensate: async () => {
      await budgetService.updateBudgetStatus(budgetId, 'pending');
    },
  });
  
  // 2. 承認者の記録を作成
  saga.addStep({
    execute: async () => {
      await approvalService.createApprovalRecord(budgetId, approverId);
    },
    compensate: async () => {
      await approvalService.deleteApprovalRecord(budgetId, approverId);
    },
  });
  
  // 3. 予算の状態を「承認済み」に更新
  saga.addStep({
    execute: async () => {
      await budgetService.updateBudgetStatus(budgetId, 'approved');
    },
    compensate: async () => {
      await budgetService.updateBudgetStatus(budgetId, 'approving');
    },
  });
  
  // 4. 通知を送信
  saga.addStep({
    execute: async () => {
      await notificationService.sendBudgetApprovalNotification(budgetId);
    },
    // 通知の補償トランザクションは不要（冪等性があるため）
  });
  
  // サガを実行
  try {
    await saga.execute();
  } catch (error) {
    // エラーログ記録
    logger.error('Budget approval saga failed', {
      budgetId,
      approverId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // エラーを上位に伝播
    throw error;
  }
}

// Sagaクラスの実装
class Saga {
  private steps: Array<{
    execute: () => Promise<void>;
    compensate?: () => Promise<void>;
  }> = [];
  
  addStep(step: { execute: () => Promise<void>; compensate?: () => Promise<void> }) {
    this.steps.push(step);
  }
  
  async execute() {
    const executedSteps: number[] = [];
    
    try {
      // 各ステップを順番に実行
      for (let i = 0; i < this.steps.length; i++) {
        await this.steps[i].execute();
        executedSteps.push(i);
      }
    } catch (error) {
      // エラーが発生した場合、実行済みのステップを逆順に補償
      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const stepIndex = executedSteps[i];
        if (this.steps[stepIndex].compensate) {
          try {
            await this.steps[stepIndex].compensate!();
          } catch (compensationError) {
            // 補償トランザクション自体が失敗した場合のログ記録
            logger.error('Compensation transaction failed', {
              stepIndex,
              originalError: error,
              compensationError,
            });
          }
        }
      }
      
      // エラーを上位に伝播
      throw error;
    }
  }
}
\`\`\`

### 将来的な分散トランザクション対応

将来的にマイクロサービスアーキテクチャに移行する場合は、以下の技術を検討します：

1. **2相コミット（2PC）**: 分散トランザクションの古典的なアプローチ
2. **TCC（Try-Confirm-Cancel）**: 2PCの改良版で、ビジネスロジックに特化
3. **イベントソーシング**: イベントを中心としたアーキテクチャで一貫性を確保

ただし、初期段階では複雑さを避けるため、これらの高度な分散トランザクション技術は採用せず、最終的一貫性とサガパターンで対応します。
