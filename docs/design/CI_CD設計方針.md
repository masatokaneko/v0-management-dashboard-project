# CI/CD 設計方針

## Git フロー

本プロジェクトでは、以下のブランチ戦略を採用します。

### ブランチ構成

- **main**: 本番環境にデプロイされるコード。常に安定した状態を維持。
- **develop**: 開発環境の最新コード。機能実装後のテスト環境。
- **feature/\***: 個別機能の開発用ブランチ。developから分岐し、完了後developにマージ。
- **release/\***: リリース準備用ブランチ。developから分岐し、リリース準備完了後mainとdevelopにマージ。
- **hotfix/\***: 緊急バグ修正用ブランチ。mainから分岐し、修正後mainとdevelopにマージ。

### ブランチ運用ルール

1. **feature ブランチ**:
   - 命名規則: `feature/[チケット番号]-[機能名]`
   - 例: `feature/DASH-123-sales-chart-implementation`
   - developから分岐し、開発完了後はPRを経てdevelopにマージ

2. **release ブランチ**:
   - 命名規則: `release/v[メジャー].[マイナー].[パッチ]`
   - 例: `release/v1.2.0`
   - リリース準備（最終テスト、ドキュメント更新など）を行う
   - 完了後、mainとdevelopの両方にマージ

3. **hotfix ブランチ**:
   - 命名規則: `hotfix/[チケット番号]-[修正内容]`
   - 例: `hotfix/DASH-456-fix-calculation-bug`
   - 本番環境のクリティカルな問題に対応
   - 修正後、mainとdevelopの両方にマージ

## GitHub Actions ジョブ構成

本プロジェクトでは GitHub Actions を使用して CI/CD パイプラインを構築します。

### ワークフロー構成

#### 1. コード品質チェック (quality-check.yml)

\`\`\`yaml
name: Code Quality Check
on:
  pull_request:
    branches: [ develop, main, release/* ]
  push:
    branches: [ develop, main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
\`\`\`

#### 2. テスト実行 (test.yml)

\`\`\`yaml
name: Test
on:
  pull_request:
    branches: [ develop, main, release/* ]
  push:
    branches: [ develop, main ]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
\`\`\`

#### 3. デプロイ (deploy.yml)

\`\`\`yaml
name: Deploy
on:
  push:
    branches: [ main, develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to development
        if: github.ref == 'refs/heads/develop'
        uses: some-deployment-action@v1
        with:
          environment: development
          
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        uses: some-deployment-action@v1
        with:
          environment: production
\`\`\`

## デプロイ先とロールバック手順

### デプロイ環境

| 環境名 | ブランチ | URL | 用途 |
|--------|----------|-----|------|
| 開発環境 | develop | https://dev.management-dashboard.example.com | 開発者向けテスト環境 |
| ステージング環境 | release/* | https://staging.management-dashboard.example.com | リリース前最終確認環境 |
| 本番環境 | main | https://management-dashboard.example.com | エンドユーザー向け環境 |

### デプロイフロー

1. **開発環境**: develop ブランチへのマージで自動デプロイ
2. **ステージング環境**: release ブランチ作成時に手動承認後デプロイ
3. **本番環境**: main ブランチへのマージで手動承認後デプロイ

### ロールバック手順

#### 即時ロールバック（緊急時）

1. GitHub Actions の実行履歴から最後の安定ビルドを特定
2. 「Re-run jobs」機能を使用して以前のビルドを再デプロイ
3. または Vercel/AWS などのデプロイプラットフォームの管理画面から直前のデプロイに戻す

#### 通常ロールバック（コード修正を伴う場合）

1. hotfix ブランチを main から作成
2. 問題を修正するコミットを追加
3. PR を作成し、レビュー後 main にマージ
4. 自動デプロイパイプラインが実行される
5. 修正内容を develop にもマージ

### デプロイ監視

- デプロイ後 15 分間はエラーレートと主要メトリクスを監視
- 異常が検出された場合は自動アラートを発報
- 必要に応じて自動ロールバックを実行（設定可能）
