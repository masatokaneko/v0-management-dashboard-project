# ログ設計方針

## ログレベル設計

本プロジェクトでは、以下のログレベルを定義し、適切な情報を記録します。

### ログレベル定義

| レベル | 用途 | 例 |
|-------|------|-----|
| ERROR | 異常終了や重大な問題 | APIリクエスト失敗、データベース接続エラー |
| WARN  | 警告（処理は継続可能） | パフォーマンス低下、非推奨機能の使用 |
| INFO  | 通常の操作情報 | ユーザーログイン、重要な処理の開始/終了 |
| DEBUG | 開発時のデバッグ情報 | 関数の入出力値、処理の詳細な流れ |
| TRACE | 最も詳細なデバッグ情報 | ループの各イテレーション、低レベルの処理詳細 |

### 環境別ログレベル設定

| 環境 | デフォルトログレベル | 備考 |
|-----|-------------------|------|
| 本番環境 | INFO 以上 | ERROR, WARN, INFO のみ記録 |
| ステージング環境 | INFO 以上 | ERROR, WARN, INFO のみ記録 |
| 開発環境 | DEBUG 以上 | ERROR, WARN, INFO, DEBUG を記録 |
| ローカル環境 | TRACE 以上 | すべての  WARN, INFO のみ記録 |
| 開発環境 | DEBUG 以上 | ERROR, WARN, INFO, DEBUG を記録 |
| ローカル環境 | TRACE 以上 | すべてのログレベルを記録 |

### ログレベル使用ガイドライン

#### ERROR

- システムが正常に機能できない重大な問題
- ユーザー操作を完了できない障害
- データ整合性に関わる問題
- セキュリティ違反

\`\`\`typescript
// エラーログの例
logger.error('Failed to update budget data', {
  budgetId: 'budget-123',
  userId: 'user-456',
  error: error.message,
  stack: error.stack,
});
\`\`\`

#### WARN

- パフォーマンスの低下
- 一時的なネットワーク問題
- 非推奨APIの使用
- 自動的に回復可能な問題

\`\`\`typescript
// 警告ログの例
logger.warn('API response time exceeded threshold', {
  endpoint: '/api/dashboard/monthly-data',
  responseTime: 2500, // ms
  threshold: 1000, // ms
});
\`\`\`

#### INFO

- アプリケーションの起動/停止
- ユーザーのログイン/ログアウト
- 重要なビジネスイベント（予算承認など）
- バッチ処理の開始/終了

\`\`\`typescript
// 情報ログの例
logger.info('User logged in successfully', {
  userId: 'user-789',
  loginTime: new Date().toISOString(),
  ipAddress: '192.168.1.1',
});
\`\`\`

#### DEBUG

- 関数の入出力値
- 条件分岐の結果
- API呼び出しの詳細
- SQLクエリの実行

\`\`\`typescript
// デバッグログの例
logger.debug('Fetching monthly sales data', {
  year: 2023,
  month: 5,
  filters: { department: 'sales' },
});
\`\`\`

#### TRACE

- ループの各イテレーション
- 低レベルのライブラリ呼び出し
- 詳細なHTTPリクエスト/レスポンス

\`\`\`typescript
// トレースログの例
logger.trace('Processing sales record', {
  recordId: 'sales-123',
  index: 42,
  data: { amount: 12500, date: '2023-05-19' },
});
\`\`\`

## フォーマット（JSON 形式など）

ログの検索性と解析性を高めるために、構造化されたJSON形式でログを出力します。

### ログフォーマット定義

\`\`\`typescript
interface LogEntry {
  // 基本情報
  timestamp: string;        // ISO 8601形式のタイムスタンプ
  level: string;            // ログレベル（ERROR, WARN, INFO, DEBUG, TRACE）
  message: string;          // ログメッセージ
  
  // コンテキスト情報
  service?: string;         // サービス名
  environment?: string;     // 実行環境（production, staging, development）
  correlationId?: string;   // リクエスト追跡用ID
  userId?: string;          // ユーザーID（認証済みの場合）
  sessionId?: string;       // セッションID
  
  // 技術情報
  logger?: string;          // ロガー名
  fileName?: string;        // ソースファイル名
  functionName?: string;    // 関数名
  lineNumber?: number;      // 行番号
  
  // エラー情報（エラー時のみ）
  error?: {
    message: string;        // エラーメッセージ
    name: string;           // エラー名
    stack?: string;         // スタックトレース
    code?: string;          // エラーコード
  };
  
  // カスタムデータ
  [key: string]: any;       // その他のコンテキスト情報
}
\`\`\`

### ログ出力例

\`\`\`json
{
  "timestamp": "2023-05-19T10:15:30.123Z",
  "level": "ERROR",
  "message": "Failed to update budget data",
  "service": "management-dashboard",
  "environment": "production",
  "correlationId": "req-abc-123",
  "userId": "user-456",
  "logger": "BudgetService",
  "fileName": "budget-service.ts",
  "functionName": "updateBudget",
  "lineNumber": 42,
  "error": {
    "message": "Database connection failed",
    "name": "ConnectionError",
    "stack": "ConnectionError: Database connection failed\n    at connectToDatabase (/app/src/database.ts:15:7)\n    at updateBudget (/app/src/services/budget-service.ts:42:5)",
    "code": "DB_CONN_ERROR"
  },
  "budgetId": "budget-123",
  "attemptCount": 2
}
\`\`\`

### ログライブラリ

Node.js環境では、Winston または Pino を使用してログを出力します。

\`\`\`typescript
// logger.ts (Winston の例)
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'management-dashboard',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.Console(),
    // 本番環境では追加のトランスポートを設定（ファイル、CloudWatch など）
  ],
});

export default logger;
\`\`\`

### フロントエンドでのログ

フロントエンドでは、重要なイベントのみをバックエンドに送信してログに記録します。

\`\`\`typescript
// frontend/src/utils/logger.ts
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export async function logToServer(
  level: LogLevel,
  message: string,
  data?: Record<string, any>
) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
  } catch (error) {
    // ログ送信に失敗した場合はコンソールに出力
    console.error('Failed to send log to server', error);
  }
}

// 使用例
export const logger = {
  error: (message: string, data?: Record<string, any>) => {
    console.error(message, data);
    logToServer(LogLevel.ERROR, message, data);
  },
  warn: (message: string, data?: Record<string, any>) => {
    console.warn(message, data);
    logToServer(LogLevel.WARN, message, data);
  },
  info: (message: string, data?: Record<string, any>) => {
    console.info(message, data);
    logToServer(LogLevel.INFO, message, data);
  },
};
\`\`\`

## ログ集約・可視化ツール

ログを効率的に収集、分析、可視化するためのツールとアーキテクチャを定義します。

### ログ収集アーキテクチャ

\`\`\`
アプリケーション → ログ収集エージェント → ログストレージ → 分析・可視化ツール
\`\`\`

### 推奨ツール

#### 1. クラウドネイティブ環境（AWS）

- **CloudWatch Logs**: ログの収集と保存
- **CloudWatch Insights**: ログの検索と分析
- **CloudWatch Dashboards**: メトリクスとログの可視化

#### 2. オープンソースソリューション

- **ELK Stack**:
  - Elasticsearch: ログの保存と検索
  - Logstash: ログの収集と変換
  - Kibana: ログの可視化とダッシュボード

- **Grafana + Loki**:
  - Loki: ログの保存と検索
  - Grafana: ログとメトリクスの可視化

#### 3. SaaSソリューション

- **Datadog**: 統合監視とログ管理
- **New Relic**: アプリケーションパフォーマンス監視とログ管理
- **Sentry**: エラートラッキングとログ管理

### ログ分析のユースケース

1. **エラー分析**: 発生頻度の高いエラーの特定と根本原因分析
2. **パフォーマンス監視**: レスポンスタイムの遅いAPIエンドポイントの特定
3. **ユーザー行動分析**: ユーザーの操作パターンと問題点の特定
4. **セキュリティ監視**: 不審なアクセスパターンの検出
5. **ビジネスインサイト**: 重要なビジネスイベントの傾向分析

### アラート設定

ログから重要な問題を検出した場合に、適切なチームに通知するアラートを設定します。

\`\`\`yaml
# アラート設定例（CloudWatch Alarms）
Alarms:
  - Name: HighErrorRate
    Description: "Error rate exceeds threshold"
    MetricName: ErrorCount
    Namespace: ManagementDashboard
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - arn:aws:sns:region:account-id:alert-topic
    Dimensions:
      - Name: Environment
        Value: Production
\`\`\`

### ログ保持ポリシー

コスト管理とコンプライアンスのために、ログの保持期間を定義します。

| ログタイプ | 保持期間 | 備考 |
|----------|---------|------|
| ERROR | 1年 | 長期的な問題分析のため |
| WARN | 6ヶ月 | 中期的な傾向分析のため |
| INFO | 3ヶ月 | 短期的な運用分析のため |
| DEBUG | 1週間 | 開発環境のみ |
| TRACE | 1日 | 開発環境のみ |

### セキュリティとプライバシー

ログに含まれる機密情報を保護するためのポリシーを定義します。

1. **個人情報のマスキング**: メールアドレス、電話番号などの個人情報をマスク
2. **認証情報の除外**: パスワード、トークン、APIキーなどの認証情報をログに記録しない
3. **アクセス制御**: ログへのアクセス権限を適切に制限
4. **暗号化**: 保存ログと転送中のログを暗号化

\`\`\`typescript
// 個人情報マスキングの例
function maskSensitiveData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    const masked = { ...data };
    
    // メールアドレスのマスキング
    if (masked.email) {
      const [name, domain] = masked.email.split('@');
      masked.email = `${name.substring(0, 2)}***@${domain}`;
    }
    
    // クレジットカード番号のマスキング
    if (masked.creditCard) {
      masked.creditCard = `****-****-****-${masked.creditCard.slice(-4)}`;
    }
    
    // 再帰的に処理
    Object.keys(masked).forEach(key => {
      masked[key] = maskSensitiveData(masked[key]);
    });
    
    return masked;
  }
  
  return data;
}

// ログ出力前にマスキング
logger.info('User profile updated', maskSensitiveData(userProfile));
\`\`\`

## ログ運用ガイドライン

### ログ出力のベストプラクティス

1. **コンテキストの提供**: ログメッセージだけでなく、関連するコンテキスト情報も含める
2. **一貫性**: 同様のイベントには一貫したログメッセージとフォーマットを使用
3. **アクション可能性**: ログから問題の原因と対策が理解できるようにする
4. **簡潔さ**: 冗長なログを避け、必要な情報のみを記録

### ログ監視の責任

| チーム | 監視対象 | 対応時間 |
|-------|---------|---------|
| 開発チーム | ERROR, WARN | 営業時間内 |
| 運用チーム | ERROR | 24時間365日 |
| セキュリティチーム | セキュリティ関連のERROR, WARN | 24時間365日 |

### ログ分析の定期レビュー

1. **日次レビュー**: ERROR ログの確認と対応
2. **週次レビュー**: WARN ログの傾向分析
3. **月次レビュー**: 全体的なログ傾向とパフォーマンス分析
4. **四半期レビュー**: ログ設計とポリシーの見直し
