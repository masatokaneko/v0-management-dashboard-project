# テスト設計方針

## 単体テスト／統合テストの構成

本プロジェクトでは、コードの品質と信頼性を確保するために、複数レベルのテストを実施します。

### テスト階層

1. **単体テスト (Unit Tests)**
2. **統合テスト (Integration Tests)**
3. **E2Eテスト (End-to-End Tests)**

### 1. 単体テスト

個々のコンポーネント、関数、モジュールが期待通りに動作することを確認するテスト。

#### テストフレームワーク

- **Jest**: テストランナーとアサーション
- **React Testing Library**: Reactコンポーネントのテスト
- **@testing-library/hooks**: カスタムフックのテスト

#### 単体テストの対象

- **コンポーネント**: 各UIコンポーネント（atoms, molecules, organisms）
- **ユーティリティ関数**: ヘルパー関数、フォーマッター、バリデーターなど
- **カスタムフック**: アプリケーション固有のReactフック
- **ストア**: Zustandストアの各スライス

#### 単体テストの例（コンポーネント）

\`\`\`typescript
// components/atoms/kpi-card.test.tsx
import { render, screen } from '@testing-library/react';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders the title and value correctly', () => {
    render(
      <KpiCard 
        title="売上" 
        value="¥10,000,000" 
        change={5.2} 
      />
    );
    
    expect(screen.getByText('売上')).toBeInTheDocument();
    expect(screen.getByText('¥10,000,000')).toBeInTheDocument();
    expect(screen.getByText('5.2%')).toBeInTheDocument();
  });
  
  it('shows positive change with up arrow', () => {
    render(
      <KpiCard 
        title="売上" 
        value="¥10,000,000" 
        change={5.2} 
      />
    );
    
    const upArrow = screen.getByTestId('arrow-up-icon');
    expect(upArrow).toBeInTheDocument();
    expect(screen.getByText('5.2%')).toHaveClass('text-emerald-500');
  });
  
  it('shows negative change with down arrow', () => {
    render(
      <KpiCard 
        title="売上" 
        value="¥10,000,000" 
        change={-3.1} 
      />
    );
    
    const downArrow = screen.getByTestId('arrow-down-icon');
    expect(downArrow).toBeInTheDocument();
    expect(screen.getByText('3.1%')).toHaveClass('text-rose-500');
  });
});
\`\`\`

#### 単体テストの例（ストア）

\`\`\`typescript
// store/dashboard-store.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDashboardStore } from './dashboard-store';

describe('useDashboardStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useDashboardStore.setState({
      monthlyData: [],
      isLoading: false,
      error: null
    });
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    expect(result.current.monthlyData).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('should set loading state when fetching data', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDashboardStore());
    
    act(() => {
      result.current.fetchData();
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.monthlyData.length).toBeGreaterThan(0);
  });
});
\`\`\`

### 2. 統合テスト

複数のコンポーネントやモジュールが連携して動作することを確認するテスト。

#### 統合テストの対象

- **ページコンポーネント**: 複数のコンポーネントを組み合わせたページ
- **データフロー**: APIリクエストからUIレンダリングまでの一連の流れ
- **ストア連携**: ストアとコンポーネントの連携

#### 統合テストの例

\`\`\`typescript
// pages/Dashboard/index.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './index';
import { useDashboardStore } from '@/store/dashboard-store';

// モックデータ
const mockMonthlyData = [
  {
    month: '4',
    actualSales: 85000000,
    budgetSales: 80000000,
    salesAchievement: 106.3,
    // ... その他のデータ
  },
  // ... その他の月のデータ
];

// Zustandストアのモック
jest.mock('@/store/dashboard-store', () => ({
  useDashboardStore: jest.fn()
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    // ストアのモック実装
    (useDashboardStore as jest.Mock).mockImplementation(() => ({
      monthlyData: mockMonthlyData,
      isLoading: false,
      error: null,
      fetchData: jest.fn()
    }));
  });
  
  it('renders KPI cards with correct data', async () => {
    render(<DashboardPage />);
    
    // KPIカードが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('売上')).toBeInTheDocument();
      expect(screen.getByText('費用')).toBeInTheDocument();
      expect(screen.getByText('利益')).toBeInTheDocument();
    });
    
    // 最新の売上データが表示されることを確認
    expect(screen.getByText('¥110,000,000')).toBeInTheDocument();
  });
  
  it('renders achievement chart', async () => {
    render(<DashboardPage />);
    
    // 達成率チャートのタイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('売上達成率（予実比）')).toBeInTheDocument();
    });
  });
  
  it('shows loading state', async () => {
    // ローディング状態のモック
    (useDashboardStore as jest.Mock).mockImplementation(() => ({
      monthlyData: [],
      isLoading: true,
      error: null,
      fetchData: jest.fn()
    }));
    
    render(<DashboardPage />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });
  
  it('shows error state', async () => {
    // エラー状態のモック
    (useDashboardStore as jest.Mock).mockImplementation(() => ({
      monthlyData: [],
      isLoading: false,
      error: 'データの取得に失敗しました',
      fetchData: jest.fn()
    }));
    
    render(<DashboardPage />);
    
    expect(screen.getByText('エラー: データの取得に失敗しました')).toBeInTheDocument();
  });
});
\`\`\`

### 3. E2Eテスト

ユーザーの視点からアプリケーション全体の動作を確認するテスト。

#### E2Eテストフレームワーク

- **Cypress**: ブラウザベースのE2Eテスト
- **Playwright**: 複数ブラウザ対応のE2Eテスト

#### E2Eテストの例

\`\`\`typescript
// cypress/e2e/dashboard.cy.ts
describe('Dashboard Page', () => {
  beforeEach(() => {
    // APIリクエストのモック
    cy.intercept('GET', '/api/dashboard/monthly-data', { fixture: 'monthly-data.json' }).as('getMonthlyData');
    
    // ダッシュボードページにアクセス
    cy.visit('/dashboard');
    
    // APIリクエストの完了を待機
    cy.wait('@getMonthlyData');
  });
  
  it('displays KPI cards', () => {
    cy.get('[data-testid="kpi-card-sales"]').should('be.visible');
    cy.get('[data-testid="kpi-card-costs"]').should('be.visible');
    cy.get('[data-testid="kpi-card-profit"]').should('be.visible');
  });
  
  it('displays achievement chart', () => {
    cy.get('[data-testid="achievement-chart"]').should('be.visible');
  });
  
  it('navigates to sales page when clicking on sales card', () => {
    cy.get('[data-testid="kpi-card-sales"]').click();
    cy.url().should('include', '/sales');
  });
});
\`\`\`

## テストカバレッジ基準

コードの品質を確保するために、以下のテストカバレッジ基準を設定します。

### カバレッジ目標

| コード種別 | ステートメントカバレッジ | ブランチカバレッジ | 関数カバレッジ |
|----------|----------------------|-----------------|-------------|
| ユーティリティ関数 | 90% | 85% | 95% |
| コンポーネント | 80% | 75% | 85% |
| ページ | 70% | 65% | 75% |
| 全体 | 75% | 70% | 80% |

### カバレッジレポート

テスト実行時にカバレッジレポートを生成し、CI/CDパイプラインで確認します。

\`\`\`json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 70,
      functions: 80,
      lines: 75
    },
    "src/utils/**/*.ts": {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90
    },
    "src/components/**/*.tsx": {
      statements: 80,
      branches: 75,
      functions: 85,
      lines: 80
    }
  }
}
\`\`\`

### カバレッジ除外

テストが不要または困難なコードは、カバレッジ計算から除外します。

\`\`\`typescript
/* istanbul ignore file */
// 設定ファイルなど、テスト不要なファイル全体を除外

function complexFunction() {
  // 通常のコード
  
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development') {
    // 開発環境でのみ実行されるコード
    console.log('Debug info');
  }
}
\`\`\`

## モック／スタブの運用方針

テスト実行時に外部依存を分離するためのモックとスタブの運用方針を定義します。

### モック対象

1. **外部API**: バックエンドAPIや外部サービス
2. **ブラウザAPI**: localStorage, sessionStorage, window.fetch など
3. **時間関連**: Date, setTimeout, setInterval など
4. **ランダム値**: Math.random など

### モックライブラリ

- **Jest**: 基本的なモック機能
- **MSW (Mock Service Worker)**: APIリクエストのモック
- **jest-localstorage-mock**: localStorage/sessionStorageのモック

### モック実装例

#### APIリクエストのモック (MSW)

\`\`\`typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/dashboard/monthly-data', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          month: '4',
          actualSales: 85000000,
          budgetSales: 80000000,
          salesAchievement: 106.3,
          // ... その他のデータ
        },
        // ... その他の月のデータ
      ])
    );
  }),
  
  rest.get('/api/dashboard/monthly-data', (req, res, ctx) => {
    // エラーケースのテスト用
    return res(
      ctx.status(500),
      ctx.json({ message: 'Internal Server Error' })
    );
  }),
];
\`\`\`

#### Zustandストアのモック

\`\`\`typescript
// __mocks__/store/dashboard-store.ts
import { MonthlyData } from '@/store/dashboard-store';

const mockMonthlyData: MonthlyData[] = [
  // モックデータ
];

export const useDashboardStore = jest.fn().mockImplementation(() => ({
  monthlyData: mockMonthlyData,
  isLoading: false,
  error: null,
  fetchData: jest.fn(),
}));
\`\`\`

### スタブの実装方針

1. **最小限の実装**: テストに必要な機能のみを実装
2. **一貫性**: 同じ入力に対して常に同じ出力を返す
3. **検証可能**: スタブの呼び出し回数や引数を検証できるようにする

### モック／スタブの管理

- `__mocks__` ディレクトリにモジュール単位でモックを配置
- テストファイル内で一時的に使用するモックは、テストファイル内で定義
- 複数のテストで共有するモックは、`test/mocks` ディレクトリに配置

### テスト環境のセットアップ

\`\`\`typescript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// テスト開始前にMSWサーバーを起動
beforeAll(() => server.listen());

// 各テスト後にリクエストハンドラーをリセット
afterEach(() => server.resetHandlers());

// テスト終了後にサーバーをクローズ
afterAll(() => server.close());
