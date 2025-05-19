# ディレクトリ構成＆依存関係ルール

## モノリポ or マルチパッケージのルール

本プロジェクトでは、フロントエンドとバックエンドを含む**モノリポジトリ**アプローチを採用します。

### リポジトリ構成

\`\`\`
management-dashboard/
├── apps/
│   ├── frontend/       # フロントエンドアプリケーション (Next.js)
│   └── backend/        # バックエンドAPI (Express/NestJS)
├── packages/
│   ├── ui/             # 共有UIコンポーネント
│   ├── config/         # 共有設定
│   ├── types/          # 共有型定義
│   └── utils/          # 共有ユーティリティ
├── docs/               # プロジェクトドキュメント
├── scripts/            # ビルド・デプロイスクリプト
├── .github/            # GitHub Actions設定
├── package.json        # ルートパッケージ設定
└── turbo.json          # Turborepo設定
\`\`\`

### パッケージマネージャー

- **pnpm**: 高速でディスク効率の良いパッケージマネージャー
- **Workspaces**: pnpmのワークスペース機能を使用してモノレポを管理

\`\`\`json
// package.json
{
  "name": "management-dashboard",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

### ビルドツール

- **Turborepo**: モノレポのビルドとタスク実行を最適化

\`\`\`json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
\`\`\`

## フロント／バックエンド間の依存関係

フロントエンドとバックエンド間の依存関係を明確に定義し、適切な分離を維持します。

### 依存関係の方向

- **フロントエンド → バックエンド**: 型定義のみ許可
- **バックエンド → フロントエンド**: 依存関係なし

### 共有コード

共有が必要なコードは `packages` ディレクトリ内の独立したパッケージとして実装します。

\`\`\`
packages/
├── types/             # 共有型定義
│   ├── src/
│   │   ├── api.ts     # API型定義
│   │   ├── models.ts  # データモデル型定義
│   │   └── index.ts   # エクスポート
│   ├── package.json
│   └── tsconfig.json
└── utils/             # 共有ユーティリティ
    ├── src/
    │   ├── formatters.ts  # 日付・数値フォーマッター
    │   ├── validators.ts  # バリデーション関数
    │   └── index.ts       # エクスポート
    ├── package.json
    └── tsconfig.json
\`\`\`

### API通信

フロントエンドとバックエンド間の通信は、明確に定義されたREST APIまたはGraphQL APIを介して行います。

#### API型定義例

\`\`\`typescript
// packages/types/src/api.ts

// リクエスト型
export interface GetMonthlySalesRequest {
  year?: number;
  month?: number;
}

// レスポンス型
export interface GetMonthlySalesResponse {
  data: {
    month: string;
    actualSales: number;
    budgetSales: number;
    salesAchievement: number;
    // ... その他のデータ
  }[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

// API エンドポイント定義
export const API_ENDPOINTS = {
  MONTHLY_SALES: '/api/dashboard/monthly-sales',
  MONTHLY_COSTS: '/api/dashboard/monthly-costs',
  MONTHLY_PROFITS: '/api/dashboard/monthly-profits',
  BUDGET_COMPARISON: '/api/dashboard/budget-comparison',
} as const;
\`\`\`

## インポートパスの絶対／相対ルール

コードの可読性と保守性を高めるために、一貫したインポートパスのルールを定義します。

### 基本ルール

1. **絶対パス**: 異なるディレクトリ間のインポート
2. **相対パス**: 同じディレクトリ内のインポート

### パスエイリアス

TypeScriptの `paths` オプションを使用して、絶対パスのエイリアスを定義します。

\`\`\`json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@api/*": ["src/api/*"],
      "@config/*": ["src/config/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
\`\`\`

### インポート例

\`\`\`typescript
// 絶対パスの例
import { Button } from '@components/atoms/button';
import { useDashboardStore } from '@store/dashboard-store';
import { formatCurrency } from '@utils/formatters';

// 相対パスの例（同じディレクトリ内）
import { CardHeader } from './card-header';
import { CardFooter } from './card-footer';
\`\`\`

### インポート順序

コードの一貫性を保つために、インポートは以下の順序で記述します：

1. 外部ライブラリ（React, Next.js など）
2. 内部の絶対パスインポート（アルファベット順）
3. 相対パスインポート（アルファベット順）
4. スタイルインポート

\`\`\`typescript
// 外部ライブラリ
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// 内部の絶対パスインポート
import { Button } from '@components/atoms/button';
import { useDashboardStore } from '@store/dashboard-store';
import { formatCurrency } from '@utils/formatters';

// 相対パスインポート
import { CardContent } from './card-content';
import { CardHeader } from './card-header';

// スタイルインポート
import './card.css';
\`\`\`

## コンポーネント構成ルール

Atomic Designパターンに基づいたコンポーネント構成を採用します。

\`\`\`
src/
└── components/
    ├── atoms/         # 最小単位のコンポーネント
    │   ├── button.tsx
    │   ├── input.tsx
    │   └── ...
    ├── molecules/     # atomsを組み合わせたコンポーネント
    │   ├── form-field.tsx
    │   ├── search-bar.tsx
    │   └── ...
    ├── organisms/     # 複雑な機能を持つコンポーネント
    │   ├── data-table.tsx
    │   ├── navigation-menu.tsx
    │   └── ...
    └── layout/        # レイアウト関連のコンポーネント
        ├── header.tsx
        ├── sidebar.tsx
        └── ...
\`\`\`

### コンポーネント間の依存関係

- **atoms**: 外部依存なし、または基本的なライブラリのみ
- **molecules**: atomsに依存可能
- **organisms**: atomsとmoleculesに依存可能
- **layout**: すべてのコンポーネントに依存可能

### ページコンポーネント

ページコンポーネントは `pages` ディレクトリに配置し、レイアウトとコンテンツの組み合わせに責任を持ちます。

\`\`\`
src/
└── pages/
    ├── Dashboard/
    │   ├── components/        # ページ固有のコンポーネント
    │   │   ├── kpi-summary.tsx
    │   │   └── ...
    │   ├── hooks/             # ページ固有のフック
    │   │   └── use-dashboard-data.ts
    │   ├── index.tsx          # ページのエントリーポイント
    │   └── dashboard.test.tsx # ページのテスト
    └── ...
\`\`\`

## 依存関係の循環参照防止

コードの保守性と予測可能性を高めるために、循環参照を防止します。

### 循環参照検出

- **madge**: 依存関係の循環参照を検出するツール

\`\`\`json
// package.json
{
  "scripts": {
    "check-circular": "madge --circular src/"
  },
  "devDependencies": {
    "madge": "^5.0.0"
  }
}
\`\`\`

### 循環参照防止のベストプラクティス

1. **明確な階層構造**: Atomic Designの階層を厳格に守る
2. **共通ユーティリティ**: 複数のモジュールで使用される機能は共通ユーティリティとして抽出
3. **依存性の方向**: 常に低レベルのモジュールから高レベルのモジュールへの依存方向を維持
4. **インターフェース分離**: 大きなモジュールは小さなインターフェースに分割
