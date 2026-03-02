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
| `getNodes` | ノード一覧取得（ページネーション対応） | `OsfClient.nodes` と重複 | **移行する**（タスク4） |
| `getProject` / `getProjectInfo` | 単一ノード取得 | `OsfClient.nodes` と重複 | **移行する**（タスク4） |
| `listingProjects` | プロジェクト一覧（カテゴリフィルタ） | `OsfClient.nodes` と重複 | **移行する**（タスク4） |
| `getFiles` | ファイル一覧取得（任意URL・ページネーション対応） | `OsfClient.files` と部分重複 | **維持**（任意URL対応が必要、`writeFile`/`findFilesNode` 内部で使用） |
| `readFile` | ファイル読み込み | `OsfClient.files` と重複 | **維持**（`findFilesNode` に依存するカスタムロジック） |
| `writeFile` | ファイル書き込み（ディレクトリ自動作成含む） | `OsfClient.files` と部分重複 | **維持**（カスタムロジックが複雑） |
| `findFilesNode` | パスによるファイルノード検索 | なし（カスタムロジック） | **維持** |
| `readDmpFile` | DMP ファイル読み込み（後方互換処理含む） | なし | **維持** |
| `writeDmpFile` | DMP ファイル書き込み | なし | **維持** |
| `createProject` | プロジェクト作成 | `OsfClient.nodes` と重複 | **移行する**（タスク4） |
| `listingFileNodes` | ファイルノード一覧 | `OsfClient.files` と部分重複 | **維持**（`folderNodeId` 指定パターンがパッケージ非対応） |

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

### タスク 1 調査結果（完了）

#### 調査対象パッケージ構成

- `osf-api-v2-typescript`: OSF API v2 クライアント（`OsfClient`）
- `@hirakinii-packages/grdm-api-typescript`: `OsfClient` を継承した `GrdmClient`（GRDM 拡張）

#### `OsfClient.users.me()` — `given_name_ja` / `family_name_ja`

`OsfUserAttributes` の定義:
```typescript
interface OsfUserAttributes {
  full_name: string; given_name: string; middle_names: string;
  family_name: string; suffix: string; // ...
}
// given_name_ja / family_name_ja フィールドは存在しない
```

**判定: 移行しない（維持）**
- `given_name_ja`, `family_name_ja`, `employment[].institution_ja`, `employment[].department_ja` は未対応
- タスク3の既確定方針と一致

#### `OsfClient.nodes.listNodes()` — ページネーション・フィルタリング

`NodeListParams` サポートフィルタ:

| フィルタ | サポート | `grdmClient.ts` の使用 |
|---------|--------|----------------------|
| `filter[category]` | ✓ | `listingProjects` で使用 |
| `filter[title]` | ✓ | `listingProjects` で使用 |
| `filter[description]` | ✓ | 定義済み |
| `filter[public]` | ✓ | 定義済み |
| `filter[tags]` | ✓ | 定義済み |
| `filter[date_created]` / `filter[date_modified]` | ✓ | 定義済み |
| `filter[parent]` / `filter[root]` | `[key: string]: unknown` 経由で可 | 定義済み |
| ページネーション自動追跡 | ✓ `listNodesPaginated()` + `toArray()` | `followPagination` 相当 |

**判定: 移行する**
- `listNodesPaginated().toArray()` が `followPagination=true` 相当に対応

#### `OsfClient.nodes.getById(nodeId)` — `NodeData` 相当の型

`TransformedResource<OsfNodeAttributes>` = `OsfNodeAttributes & { id, type, relationships?, links? }`

| フィールド | `NodeData` | `OsfNodeAttributes` | 互換性 |
|-----------|-----------|---------------------|------|
| `id` | ✓ | ✓ (TransformedResource) | ◎ |
| `attributes.title` | ✓ | ✓ | ◎ |
| `attributes.description` | ✓ | ✓ | ◎ |
| `attributes.category` | ✓ | ✓ | ◎ |
| `attributes.date_created` | ✓ | ✓ | ◎ |
| `attributes.date_modified` | ✓ | ✓ | ◎ |
| `links.html` / `links.self` | ✓ | ✓ | ◎ |
| `relationships` | ✓ | ✓ (TransformedResource) | ◎ |

**判定: 移行する**
- `OsfNodeAttributes` は `NodeData.attributes` の全フィールドをカバー
- ただし `TransformedResource` は attributes をフラット化するため、型変換ラッパー (`nodeToProjectInfo` 相当) が必要

#### `OsfClient.files` — ファイル書き込み・ディレクトリ作成

| 機能 | `OsfClient.files` | `grdmClient.ts` |
|------|-----------------|----------------|
| ファイル一覧（プロバイダ指定） | `listByNode(nodeId, provider)` | `getFiles(token, url)` |
| ページネーション自動追跡 | `listByNodePaginated()` + `toArray()` | `followPagination` ループ |
| ファイル更新（PUT） | `upload(file, content)` ✓ | `writeFile` |
| 新規ファイル作成 | `uploadNew(parentFolder, name, content)` ✓ | `writeFile` |
| **ディレクトリ作成** | **非対応** ✗ | `new_folder` リンクへの PUT |
| 任意 URL アクセス | **非対応** ✗ | `getFiles(token, anyUrl)` |
| ファイル読み込み | `download(file)` ✓ | `readFile` (move/upload リンク使用) |
| サブフォルダ ID 指定一覧 | **非対応** ✗ | `listingFileNodes(folderNodeId)` |

**判定**:
- `getFiles` / `readFile` / `writeFile` / `findFilesNode` / `listingFileNodes` → **維持**
  - `getFiles` は任意 URL 対応が必要（`writeFile` 内でディレクトリ作成後の URL 取得等に使用）
  - ディレクトリ自動作成ロジックは新パッケージに相当機能なし

#### パッケージのリトライ機構

`HttpClient.request()` の実装:
- **タイムアウト**: `AbortController` で 30 秒（デフォルト）✓
- **リトライ**: **なし** ✗ — 単一 fetch のみ
- **429 ハンドリング**: **なし** ✗ — エラーをそのままスロー

既存 `fetchWithRetry`:
- 最大 5 回リトライ（1 秒待機）
- 429 専用ハンドリング（1 秒後リトライ）
- 10 秒タイムアウト

**判定: fetchWithRetry は維持**
- パッケージの `HttpClient` にリトライ機構がないため必須

#### 移行判定テーブル（確定版）

| 関数 | 判定 | 移行先 / 理由 |
|------|-----|------------|
| `fetchWithRetry` | **維持** | パッケージにリトライ機構なし |
| `authenticateGrdm` | **維持** | タスク3確定 |
| `getMe` | **維持** | タスク3確定（日本語フィールド非対応） |
| `getNodes` | **移行する** | `OsfClient.nodes.listNodesPaginated()` + フィルタ対応 |
| `getProject` | **移行する** | `OsfClient.nodes.getById()` が同等の型を返す |
| `getProjectInfo` | **移行する** | `getProject` ラッパー、同様に移行可能 |
| `listingProjects` | **移行する** | `filter[category]`, `filter[title]` 両対応 |
| `getFiles` | **維持** | 任意 URL 対応が必要（`writeFile`/`findFilesNode` 内部使用） |
| `readFile` | **維持** | `findFilesNode` 依存カスタムロジック |
| `writeFile` | **維持** | ディレクトリ自動作成ロジック（パッケージ非対応） |
| `findFilesNode` | **維持** | カスタム再帰検索ロジック（相当機能なし） |
| `readDmpFile` | **維持** | DMP 固有処理 |
| `writeDmpFile` | **維持** | DMP 固有処理 |
| `createProject` | **移行する** | `OsfClient.nodes.create()` が同等機能 |
| `listingFileNodes` | **維持** | `folderNodeId` 指定 URL パターンがパッケージ非対応 |

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

### タスク 4: Nodes 系 API の移行（`getNodes`, `getProject`, `listingProjects`, `createProject`）

**目的**: タスク1の調査結果に基づき、Nodes 系関数を新パッケージへ移行する。

**判断結果（確定）**: `OsfClient.nodes` がページネーション・フィルタリングをサポートすることが確認された。

**移行対象**:

| 関数 | 移行先 | 複雑度 | 備考 |
|------|--------|--------|------|
| `getNodes` | `OsfClient.nodes.listNodesPaginated()` | 中 | `followPagination` → `toArray()` 切替 |
| `getProject` | `OsfClient.nodes.getById()` | 低 | 型変換ラッパー要 |
| `getProjectInfo` | `OsfClient.nodes.getById()` + 変換 | 低 | `nodeToProjectInfo` 相当を維持 |
| `listingProjects` | `OsfClient.nodes.listNodesPaginated()` + フィルタ | 中 | `filter[category]`, `filter[title]` 対応済み |
| `createProject` | `OsfClient.nodes.create()` | 低 | 引数形式の変換要 |

**維持確定（ファイル系）**:

| 関数 | 理由 |
|------|------|
| `getFiles` | 任意 URL アクセスが必要（パッケージは `node/provider` パターン固定） |
| `listingFileNodes` | `folderNodeId` 指定 URL パターンがパッケージ非対応 |

**作業内容（移行する関数）**:
1. 各関数を新パッケージの API を使ったラッパーに置き換え
2. 既存の `NodeData`, `ProjectInfo`, `GetNodesResponse` 等の型・インターフェースを維持（後方互換性）
3. 既存の呼び出し元（各 `hooks/` ファイル）を変更なしに動作させること
4. `OsfClient` インスタンスは `fetchWithRetry` を使用せず直接呼び出す（リトライは諦めるか、必要なら別途ラップ）

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
| `OsfClient.users.me()` が `given_name_ja` / `family_name_ja` を返さない | **確定**: `OsfUserAttributes` にフィールドなし。`getMe` は既存維持（タスク3） |
| 新パッケージに `fetchWithRetry` 相当のリトライ機構がない | **確定**: `HttpClient` はタイムアウトのみでリトライなし。`fetchWithRetry` は `grdmClient.ts` に維持 |
| `writeFile` のディレクトリ自動作成ロジックが新パッケージに不在 | **確定**: `OsfClient.files` にディレクトリ作成機能なし。`writeFile` / `readFile` / `findFilesNode` / `getFiles` / `listingFileNodes` は既存を維持 |
| 移行後に呼び出し元フックの変更が必要になる | 各関数のシグネチャを維持したラッパーパターンで対応 |
| テストカバレッジの低下 | 各タスクで既存テストがパスすることを確認し、必要に応じて追加 |
| 新パッケージのバージョンアップによる Breaking Change | `package.json` のバージョン固定（`^0.1.1` → 厳密指定を検討） |

---

## 注意事項

- **TDD 必須**: タスク2（新機能）は必ずテストを先に作成してから実装すること
- **後方互換性**: `grdmClient.ts` のエクスポート型・関数名は、移行済みのものを除いて変更しないこと
- **段階的コミット**: 各タスクを独立したコミットとして実施し、問題発生時にロールバックできるようにすること
- **既知の失敗テスト除外**: `App`, `EditPage`, `Home`, `StatusPage` の smoke テストは既知の失敗のため、CI では除外すること
