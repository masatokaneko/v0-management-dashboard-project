# スケジューラー設計方針

## 定期バッチのスケジューリング方法

本プロジェクトでは、データ集計や定期レポート生成などの定期的なタスクを実行するためのスケジューラーを実装します。

### スケジューラー実装方式

#### 1. サーバーレスアプローチ（推奨）

AWS Lambda + EventBridge または Vercel Cron Jobs を使用したサーバーレスアプローチを採用します。

\`\`\`typescript
// serverless.yml または vercel.json の設定例
{
  "crons": [
    {
      "path": "/api/cron/daily-sales-aggregation",
      "schedule": "0 1 * * *"  // 毎日午前1時に実行
    },
    {
      "path": "/api/cron/monthly-report-generation",
      "schedule": "0 2 1 * *"  // 毎月1日の午前2時に実行
    }
  ]
}
\`\`\`

#### 2. アプリケーション内スケジューラー（代替案）

Node.js の `node-cron` パッケージを使用したアプリケーション内スケジューラー。

\`\`\`typescript
// scheduler/index.ts
import cron from 'node-cron';
import { dailySalesAggregation } from './jobs/sales';
import { monthlyReportGeneration } from './jobs/reports';
import { logger } from '../utils/logger';

// 毎日午前1時に売上集計を実行
cron.schedule('0 1 * * *', async () => {
  logger.info('Starting daily sales aggregation job');
  try {
    await dailySalesAggregation();
    logger.info('Daily sales aggregation completed successfully');
  } catch (error) {
    logger.error('Daily sales aggregation failed', { error });
  }
});

// 毎月1日の午前2時にレポート生成を実行
cron.schedule('0 2 1 * *', async () => {
  logger.info('Starting monthly report generation job');
  try {
    await monthlyReportGeneration();
    logger.info('Monthly report generation completed successfully');
  } catch (error) {
    logger.error('Monthly report generation failed', { error });
  }
});
\`\`\`

### 主要スケジュールジョブ

| ジョブ名 | スケジュール | 説明 | 実行時間目安 |
|---------|-------------|------|------------|
| 日次売上集計 | 毎日 01:00 | 前日の売上データを集計し、ダッシュボード用のサマリーを生成 | 5-10分 |
| 月次レポート生成 | 毎月1日 02:00 | 前月の売上・費用・利益のレポートを生成し、PDFとして保存 | 10-15分 |
| 予算達成率計算 | 毎日 01:30 | 現在の売上・費用・利益の予算達成率を計算 | 5分 |
| データバックアップ | 毎日 00:00 | 全データのバックアップを作成 | 15-30分 |
| キャッシュクリア | 毎週月曜 03:00 | 古いキャッシュデータをクリア | 5分 |

## 失敗時のリトライポリシー

ジョブ実行が失敗した場合のリトライ戦略を定義します。

### リトライ設定

- **最大リトライ回数**: 3回
- **リトライ間隔**: 指数バックオフ方式（初回: 1分、2回目: 5分、3回目: 15分）
- **リトライ条件**: 一時的なエラー（ネットワークエラー、DB接続エラーなど）のみ

### リトライ実装例

\`\`\`typescript
// utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, baseDelay: 60000 }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 最大リトライ回数に達した場合は例外をスロー
      if (attempt >= options.maxRetries) {
        throw error;
      }
      
      // 永続的なエラーの場合はリトライしない
      if (isPermanentError(error)) {
        throw error;
      }
      
      // 指数バックオフでリトライ間隔を計算
      const delay = options.baseDelay * Math.pow(2, attempt);
      logger.warn(`Job failed, retrying in ${delay/1000}s (${attempt+1}/${options.maxRetries})`, { error });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// 永続的なエラーかどうかを判定
function isPermanentError(error: any): boolean {
  // バリデーションエラーや認証エラーなど、リトライしても解決しないエラーを判定
  return error.permanent === true || 
         error.status === 400 || 
         error.status === 401 || 
         error.status === 403;
}
\`\`\`

### ジョブでの使用例

\`\`\`typescript
// jobs/sales.ts
import { withRetry } from '../utils/retry';

export async function dailySalesAggregation() {
  return withRetry(async () => {
    // 売上集計処理
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // データ取得
    const salesData = await fetchSalesData(yesterday);
    
    // 集計処理
    const aggregatedData = aggregateSales(salesData);
    
    // 結果保存
    await saveSalesAggregation(aggregatedData);
    
    return aggregatedData;
  });
}
\`\`\`

## ジョブ監視／アラート設計

スケジュールジョブの実行状況を監視し、問題が発生した場合にアラートを発報する仕組みを構築します。

### 監視指標

| 指標 | 説明 | アラート条件 |
|-----|------|------------|
| ジョブ成功率 | ジョブの成功率（成功数/実行数） | 90%未満 |
| ジョブ実行時間 | ジョブの実行にかかった時間 | 通常の2倍以上 |
| リトライ回数 | ジョブのリトライ回数 | 2回以上 |
| エラー発生数 | ジョブ実行中のエラー数 | 1回以上 |

### 監視ツール

- **CloudWatch** (AWS使用時): メトリクスとアラームの設定
- **Datadog**: 高度な監視とアラート
- **Sentry**: エラートラッキングと通知

### アラート通知チャネル

- **Slack**: 即時通知用チャンネル（#alerts-dashboard）
- **Email**: 重大なエラーの場合のみ担当者に通知
- **PagerDuty**: 営業時間外の緊急アラート

### ジョブ実行ログ

各ジョブの実行状況は以下の情報を含むログとして記録します：

- ジョブID
- ジョブ名
- 開始時刻
- 終了時刻
- 実行時間
- 実行ステータス（成功/失敗）
- エラー詳細（失敗時）
- 処理レコード数

\`\`\`typescript
// 実行ログの例
{
  "timestamp": "2023-05-19T01:00:05.123Z",
  "level": "info",
  "message": "Job completed",
  "jobId": "daily-sales-20230519",
  "jobName": "dailySalesAggregation",
  "startTime": "2023-05-19T01:00:00.000Z",
  "endTime": "2023-05-19T01:00:05.000Z",
  "duration": 5000,
  "status": "success",
  "recordsProcessed": 1250
}
\`\`\`

### ジョブ管理ダッシュボード

管理者向けに、スケジュールジョブの実行状況を可視化するダッシュボードを提供します。

- 各ジョブの最終実行状況
- 成功/失敗の履歴
- 実行時間の推移
- エラー発生率
- 手動実行機能
