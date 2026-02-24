# テスト

## 1. テスト方針

本プロジェクト (Vite + Typescript + React + MUI) において、テスト方針として以下を定める。

- **実施する検証**:
  - **型安全性**: Typescript の厳密型チェック (e.g., `strict: true`) による型の正確性を検証
  - **静的解析 (Lint)**: ESLint による構文・スタイル・ベストプラクティスの遵守を検証
  - **スモークテスト**: `src/pages` 以下の各ページの root component の基本的な動作確認
- **対象外のテスト**
  - **ユニットテスト (関数単体)**
    - 分離可能なユーティリティ関数 (下記例) などは存在するが、現時点ではコスト対効果が低いため実施しない
      - e.g., `const getFullName = (familyName: string, givenName: string): string => { // process }`
  - **E2Eテスト (e.g., ヘッドレスブラウザ)**
    - プロジェクト規模に対し導入・維持コストが大きい
    - リファクタリングや小規模機能追加時の確認手段としては過剰と判断

## 2. テスト実行手順

以下 4 ステップを CI/ローカル 双方で順番に実行する。

```bash
# 型安全性チェック
docker compose exec app npm run test:typecheck

# 静的解析 (Lint)
docker compose exec app npm run test:lint

# スモークテスト
docker compose exec app npm run test:vitest

# ビルド検証
docker compose exec app npm run build
```

また、CI ワークフロー定義は、
[.github/workflows/test.yml](../.github/workflows/test.yml) に記載されており、上記手順を自動化している。

## 3. 既知のテスト失敗

特定の環境において、以下の smoke テスト失敗が出ることが判明している。**当面は対処不要**である。

```
FAIL  test/App.test.tsx > App smoke test > mounts without crashing
FAIL  test/EditPage.test.tsx > EditPage smoke test > mounts without crashing
FAIL  test/Home.test.tsx > Home smoke test > mounts without crashing
FAIL  test/StatusPage.test.tsx > StatusPage smoke test > mounts without crashing
```

**原因**: `renderWithProviders` が `MemoryRouter` でラップしているが、`App` コンポーネント自体も内部で `Router` を持つため、
"You cannot render a `<Router>` inside another `<Router>`" というエラーが発生する。
