# Issue #21: `grdmClient.ts` 段階的移行計画

## 背景と目的

Issue #14 のタスク1調査（`docs/plans/implementation-issue-14.md` 57〜79行目）において、
`@hirakinii-packages/grdm-api-typescript` と既存 `grdmClient.ts` の間に機能的な重複が存在することが判明した。

Issue #14 の時点では「パッケージ調査後に方針決定。既存コードは段階的に移行」とリスク対策が定義されており、
本 Issue (#21) でその「段階的移行」を実施する。

### Issue #14 調査結果による移行方針

| 機能 | 既存 `grdmClient.ts` | `grdm-api-typescript` | Issue #14 の方針 |
|------|------|------|------|
| ユーザー情報取得 | `getMe(token)` (fetch直接) | `OsfClient.users` | 既存を維持 |
| ノード一覧 | `getNodes(token, ...)` | `OsfClient.nodes` | 既存を維持 |
| ファイル操作 | `getFiles`, `readFile`, `writeFile` | `OsfClient.files` | 既存を維持 |
| DMP ファイル R/W | `readDmpFile`, `writeDmpFile` | なし | 既存のみ |
| **プロジェクトメタ** | **なし** | **`GrdmClient.projectMetadata`** | **新パッケージを活用** |
| **ファイルメタ** | **なし** | **`GrdmClient.fileMetadata`** | **新パッケージを活用（実装済み）** |

---

## 現状分析

### `grdmClient.ts` の機能一覧（実装済み）

| 関数/定数 | 役割 | 新パッケージとの重複 | 本 Issue での扱い |
|-----------|------|----------------------|-------------------|
| `fetchWithRetry` | HTTP リトライ付き fetch | なし | **維持** |
| `authenticateGrdm` | 認証確認 | `OsfClient.users` と部分重複 | **維持**（日本語フィールド非対応のため） |
| `getMe` | ユーザー情報取得（日本語名フィールド含む） | `OsfClient.users` と重複 | **維持**（GRDM エンドポイントが日本語フィールドを返さないため） |
| `getNodes` | ノード一覧取得（ページネーション対応） | `OsfClient.nodes` と重複 | タスク1で調査 |
| `getProject` / `getProjectInfo` | 単一ノード取得 | `OsfClient.nodes` と重複 | タスク1で調査 |
| `listingProjects` | プロジェクト一覧（カテゴリフィルタ） | `OsfClient.nodes` と重複 | タスク1で調査 |
| `getFiles` | ファイル一覧取得（ページネーション対応） | `OsfClient.files` と重複 | タスク1で調査 |
| `readFile` | ファイル読み込み | `OsfClient.files` と重複 | タスク1で調査 |
| `writeFile` | ファイル書き込み（ディレクトリ自動作成含む） | `OsfClient.files` と部分重複 | **維持**（カスタムロジックが複雑） |
| `findFilesNode` | パスによるファイルノード検索 | なし（カスタムロジック） | **維持** |
| `readDmpFile` | DMP ファイル読み込み（後方互換処理含む） | なし | **維持** |
| `writeDmpFile` | DMP ファイル書き込み | なし | **維持** |
| `createProject` | プロジェクト作成 | `OsfClient.nodes` と重複 | タスク1で調査 |
| `listingFileNodes` | ファイルノード一覧 | `OsfClient.files` と重複 | タスク1で調査 |

### 新パッケージの活用状況

| 機能 | 提供クラス | 活用状況 |
|------|-----------|----------|
| ファイルメタデータ | `GrdmClient.fileMetadata` | **実装済み** (`src/hooks/useFileMetadata.ts`) |
| **プロジェクトメタデータ** | **`GrdmClient.projectMetadata`** | **未実装** ← 本 Issue で対応 |

---

## 実装タスク一覧

### タスク 1: `OsfClient` API 詳細調査

**目的**: `@hirakinii-packages/grdm-api-typescript` の `OsfClient` が提供する API の仕様を確認し、
各関数の移行可能性・移行優先度を確定させる。

**調査項目**:

| 調査対象 | 確認ポイント |
|----------|------------|
| `OsfClient.users.me()` | レスポンス型に `given_name_ja` / `family_name_ja` フィールドが存在するか |
| `OsfClient.nodes.list()` | ページネーション・フィルタリング（`filter[category]` 等）をサポートするか |
| `OsfClient.nodes.get(nodeId)` | `NodeData` と同等の型を返すか |
| `OsfClient.files` | ファイル書き込み（PUT）をサポートするか、ディレクトリ作成をサポートするか |
| パッケージのリトライ機構 | `fetchWithRetry` 相当のリトライ・タイムアウト機能を内蔵しているか |

**作業内容**:
1. npm パッケージのソースコード・型定義 (`node_modules/@hirakinii-packages/grdm-api-typescript`) を調査
2. 調査結果を基に各関数の移行判定テーブルを更新する（本ドキュメントを更新）

**完了条件**: 各関数に「移行する」「維持する」「要対応」の最終判定が記載されること

---

### タスク 2: `GrdmClient.projectMetadata` の活用（新機能追加）

**目的**: Issue #14 の調査で判明した未活用機能 `GrdmClient.projectMetadata` を使い、
GRDM に登録済みのプロジェクトメタデータを表示する機能を追加する。

`GrdmRegisteredMeta` が提供するフィールド:

| フィールド | 内容 | DMP フィールドへの活用 |
|-----------|------|----------------------|
| `funder` | 助成機関情報 | `projectInfo.fundingAgency` の参照・確認 |
| `programNameJa` / `programNameEn` | プログラム名（日英） | `projectInfo.programName` の補完 |
| `projectNameJa` / `projectNameEn` | プロジェクト名（日英） | `projectInfo.projectName` の確認 |
| `japanGrantNumber` | 課題番号（KAKEN番号） | `projectInfo.projectCode` の確認 |
| `fundingStreamCode` | 助成区分コード | `projectInfo.programCode` の確認 |
| `grdmFiles` | 登録済みファイル一覧 | 参照情報として表示 |

**対象ファイル**:
- `src/hooks/useGrdmProjectMetadata.ts` (新規作成)
- `src/components/EditProject/ProjectTableSection.tsx` (変更)

**作業内容**:

1. `useGrdmProjectMetadata` カスタムフック作成
   - `GrdmClient` を初期化し `client.projectMetadata.listByNode(nodeId)` を呼び出す
   - `GrdmClient` の `baseUrl` は `GRDM_CONFIG.API_BASE_URL` を利用（`useFileMetadata.ts` と同パターン）
   - TanStack Query (`useQuery`) でキャッシュ管理
   - `queryKey: ["grdmProjectMetadata", token, nodeId]`

2. `ProjectTableSection.tsx` でメタデータを表示
   - リンク済みプロジェクト（`linkedGrdmProjects`）に対して `useGrdmProjectMetadata` を呼び出す
   - `GrdmRegisteredMeta` のフィールドをプロジェクト行に付加情報として表示
   - ローディング・エラー状態の UI 表示

**TDD**:

```
test/hooks/useGrdmProjectMetadata.test.ts
  - GrdmClient をモックし、projectMetadata.listByNode が正常レスポンスを返す場合のテスト
  - GrdmClient がエラーを throw する場合のテスト（useQuery の error state）
  - token が空の場合は query が enabled: false になることを確認
```

---

### タスク 3: `getMe` / `authenticateGrdm` の移行 — **維持確定**

**判断結果（確定）**: GRDM の `users/me` エンドポイントは `family_name_ja` / `given_name_ja` 等の日本語フィールドを返さないことが判明。
`@hirakinii-packages/grdm-api-typescript` 側でも日本語氏名対応は保留されているため、
`OsfClient.users` への移行は**実施しない**。

**対応内容**:
- `grdmClient.ts` の `getMe` / `getMeResponseSchema` / `authenticateGrdm` を**現状のまま維持**する
- `getMeResponseSchema` に定義済みの `given_name_ja` / `family_name_ja` フィールドは、
  GRDM 側が将来的にフィールドを追加した際に対応できる形で残しておく
- 理由をコードコメントに明記する（Issue #21 参照）

**作業内容**:
1. `grdmClient.ts` の `getMe` 付近に以下のコメントを追加する:
   ```typescript
   // NOTE: OsfClient.users.me() does not return Japanese name fields
   // (family_name_ja, given_name_ja). Migration to grdm-api-typescript
   // is deferred until the upstream package supports these fields. (Issue #21)
   ```
2. 既存の `test/hooks/useUser.test.ts` が引き続きパスすることを確認

**完了条件**: コメントを追加し、既存テストがパスすること

---

### タスク 4: 読み取り系 API の移行評価（`getNodes`, `getFiles`）

**目的**: タスク1の調査結果に基づき、`getNodes` と `getFiles` を新パッケージへ移行するか判断し実施する。

**判断基準**:

- **移行する**: `OsfClient.nodes` / `OsfClient.files` が以下をサポートする場合
  - ページネーション自動追跡（`followPagination` 相当）
  - フィルタリング（`filter[category]`, `filter[title]` 等）
  - 既存の `fetchWithRetry` 相当のリトライ機構

- **維持する**: 上記サポートが不十分な場合（カスタムロジックが多い）

**移行対象候補**:

| 関数 | 移行候補 | 複雑度 |
|------|---------|--------|
| `getNodes` | `OsfClient.nodes.list()` | 中（ページネーション・フィルタリング） |
| `getProject` | `OsfClient.nodes.get()` | 低 |
| `getProjectInfo` | `OsfClient.nodes.get()` + 変換 | 低 |
| `listingProjects` | `OsfClient.nodes.list()` + フィルタ | 中 |
| `getFiles` | `OsfClient.files.list()` | 中（ページネーション） |
| `listingFileNodes` | `OsfClient.files.list()` | 低 |
| `createProject` | `OsfClient.nodes.create()` | 低 |

**作業内容（移行する場合）**:
1. 各関数を新パッケージの API を使ったラッパーに置き換え
2. 既存の `FilesNode`, `NodeData` 等の型を維持（後方互換性）
3. 既存の呼び出し元（各 `hooks/` ファイル）を変更なしに動作させること

**TDD**:
- 各フックのテスト（`useProjects`, `useDmpProjects`, `useProjectInfo` 等）が引き続きパスすること

---

### タスク 5: `grdmClient.ts` のスリム化とドキュメント化

**目的**: タスク3・4の移行完了後、`grdmClient.ts` から移行済みのコードを削除し、
残存コードの役割を明確にする。

**作業内容**:

1. 移行済み関数の削除（タスク3・4で移行した関数を削除）
2. 残存コードへのドキュメント追加
   - `readDmpFile` / `writeDmpFile`: DMP ファイル固有の処理を担う理由
   - `findFilesNode`: パスによる再帰的ノード検索（新パッケージに相当機能なし）
   - `fetchWithRetry`: カスタムリトライロジック（新パッケージが対応していない場合）
3. `grdmClient.ts` の責務を「DMP ファイル操作専用クライアント」として再定義

**完了条件**: 削除後も全テストがパスし、TypeScript ビルドが通ること

---

## 実装順序と依存関係

```
タスク 1 (OsfClient API 調査)  ← 最初に実施（後続タスクの判断基準）
  │
  ├─→ タスク 2 (projectMetadata 活用)  ← 独立して先行実施可能
  │
  ├─→ タスク 3 (getMe 移行評価)
  │     └─→ タスク 5 (grdmClient.ts スリム化)
  │
  └─→ タスク 4 (getNodes/getFiles 移行評価)
        └─→ タスク 5 (grdmClient.ts スリム化)
```

> **注意**: タスク2は調査結果に依存しないため、タスク1と並行して開始できる。

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| `OsfClient.users.me()` が `given_name_ja` / `family_name_ja` を返さない | **確定**: GRDM エンドポイント・新パッケージともに日本語氏名フィールドなし。`getMe` は既存維持（タスク3） |
| 新パッケージに `fetchWithRetry` 相当のリトライ機構がない | `fetchWithRetry` は `grdmClient.ts` に維持 |
| `writeFile` のディレクトリ自動作成ロジックが新パッケージに不在 | `writeFile` / `readFile` / `findFilesNode` は既存を維持 |
| 移行後に呼び出し元フックの変更が必要になる | 各関数のシグネチャを維持したラッパーパターンで対応 |
| テストカバレッジの低下 | 各タスクで既存テストがパスすることを確認し、必要に応じて追加 |
| 新パッケージのバージョンアップによる Breaking Change | `package.json` のバージョン固定（`^0.1.1` → 厳密指定を検討） |

---

## 注意事項

- **TDD 必須**: タスク2（新機能）は必ずテストを先に作成してから実装すること
- **後方互換性**: `grdmClient.ts` のエクスポート型・関数名は、移行済みのものを除いて変更しないこと
- **段階的コミット**: 各タスクを独立したコミットとして実施し、問題発生時にロールバックできるようにすること
- **既知の失敗テスト除外**: `App`, `EditPage`, `Home`, `StatusPage` の smoke テストは既知の失敗のため、CI では除外すること
