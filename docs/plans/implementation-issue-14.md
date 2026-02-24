# Issue #14: 内部フィードバック対応 実装計画

## 現状分析

### 技術スタック
- React 18 + TypeScript + Vite
- MUI v7 (UIコンポーネント)
- React Hook Form + Zod (フォーム管理・バリデーション)
- TanStack Query (データフェッチ・キャッシュ)
- Recoil (グローバル状態管理)

### 主要ファイル
| ファイル | 役割 |
|----------|------|
| `src/dmp.ts` | DMP の型定義・Zodスキーマ・初期値 |
| `src/grdmClient.ts` | GRDM API クライアント (直接 fetch) |
| `src/pages/EditProject.tsx` | DMP 編集ページ |
| `src/components/EditProject/ProjectInfoSection.tsx` | プロジェクト情報フォーム |
| `src/components/EditProject/DataInfoSection.tsx` | 研究データ情報フォーム |
| `src/components/EditProject/PersonInfoSection.tsx` | 担当者情報フォーム |
| `src/components/EditProject/ProjectTableSection.tsx` | GRDM プロジェクト関連付けテーブル |
| `src/components/EditProject/FileTreeSection.tsx` | GRDM ファイルツリー |
| `src/components/EditProject/FormCard.tsx` | 保存ボタン含む外枠カード |

---

## 実装タスク一覧

### タスク 1: 外部パッケージのインストールと API 調査

**目的**: 2つの外部パッケージを導入し、提供するAPI・型を確認する

**作業内容**:
1. `@hirakinii-packages/kaken-api-client-typescript` をインストール　→　完了
2. `@hirakinii-packages/grdm-api-typescript` をインストール　→　完了
3. 各パッケージのエクスポート型・関数を確認し、既存 `grdmClient.ts` との関係を整理　→　完了

**完了条件**: パッケージがインストールされ、TypeScript のビルドが通る　→　**完了**

---

### タスク 1: API 調査結果サマリー

#### `@hirakinii-packages/kaken-api-client-typescript`

| 要素 | 内容 |
|------|------|
| メインクラス | `KakenApiClient` |
| プロジェクト検索 | `client.projects.search({ projectNumber: "..." })` → `ProjectsResponse` |
| 主要型 | `Project` (id, awardNumber, title, titleEn, periodOfAward, members, allocations, institutions) |
| 氏名型 | `PersonName` (fullName, familyName, givenName, familyNameReading, givenNameReading) |
| 助成期間 | `PeriodOfAward` (startFiscalYear, endFiscalYear) |
| キャッシュ | ファイルベースのキャッシュ内蔵 (useCache オプション) |

**既存コードとの関係**: `grdmClient.ts` に KAKEN API 関連機能なし。タスク2で新規追加。

#### `@hirakinii-packages/grdm-api-typescript`

| 要素 | 内容 |
|------|------|
| メインクラス | `GrdmClient extends OsfClient` |
| プロジェクトメタ | `client.projectMetadata.listByNode(nodeId)` / `getById(id)` → `GrdmRegisteredMeta` |
| ファイルメタ | `client.fileMetadata.getByProject(projectId)` / `findFileByPath()` / `getActiveMetadata()` |
| 登録済みメタデータ | `GrdmRegisteredMeta` (funder, programNameJa/En, projectNameJa/En, japanGrantNumber, fundingStreamCode, grdmFiles) |
| ファイルメタデータ | `GrdmFileMetadataSchema` (grdm-file:file-size, grdm-file:creators, etc.) |
| ユーティリティ | `inferV1BaseUrl(v2BaseUrl)` - v2 URL から v1 URL を推論 |

**既存 `grdmClient.ts` との重複・関係**:

| 機能 | 既存 `grdmClient.ts` | `grdm-api-typescript` | 方針 |
|------|------|------|------|
| ユーザー情報取得 | `getMe(token)` (fetch直接) | OsfClient.users リソース | **既存を維持** (日本語名フィールドは既存に既にある) |
| ノード一覧 | `getNodes(token, ...)` | OsfClient.nodes | **既存を維持** |
| ファイル操作 | `getFiles`, `readFile`, `writeFile` | OsfClient.files | **既存を維持** |
| DMP ファイル R/W | `readDmpFile`, `writeDmpFile` | なし | **既存のみ** |
| **プロジェクトメタ** | **なし** | **`GrdmClient.projectMetadata`** | **新パッケージを活用** |
| **ファイルメタ** | **なし** | **`GrdmClient.fileMetadata`** | **新パッケージを活用** |

**重要観察**: 既存 `getMe` の `GetMeResponse` には `employment[].institution_ja` / `department_ja` が既にある。ただし `family_name_ja` / `given_name_ja` などの日本語氏名フィールドは**含まれていない**。タスク3では新パッケージで日本語氏名取得の方法を検討が必要。

---

### タスク 2: KAKEN API 統合 (プロジェクト情報自動補完)

**目的**: KAKEN API を使い、プロジェクト番号から `ProjectInfoSection` の入力フィールドを自動補完する

**対象ファイル**:
- `src/hooks/useKakenProject.ts` (新規作成)
- `src/components/EditProject/ProjectInfoSection.tsx` (変更)

**KAKEN API → DMP フィールドのマッピング**:

| DMP フィールド | KAKEN `Project` のソース | 備考 |
|---|---|---|
| `fundingAgency` | `allocations[0].name` | 配分区分名 (例: "科学研究費助成事業") |
| `programName` | `allocations[0].name` | `fundingAgency` と同一 or 細分化が必要な場合は別途確認 |
| `programCode` | `allocations[0].code` | 配分区分コード |
| `projectCode` | `awardNumber` | KAKEN の課題番号 (例: "23K12345") |
| `projectName` | `title` | 日本語タイトル |
| `adoptionYear` | `periodOfAward.startFiscalYear` | 採択年度 (数値→文字列変換) |
| `startYear` | `periodOfAward.startFiscalYear` | 事業開始年度 |
| `endYear` | `periodOfAward.endFiscalYear` | 事業終了年度 |

**作業内容**:
1. `useKakenProject` カスタムフックの作成
   - `KakenApiClient` を `useCache: false` で初期化 (ブラウザではファイルキャッシュ不可)
   - `client.projects.search({ projectNumber: kakenNumber })` で検索
   - 結果の `items[0]` を DMP フィールドにマッピングする変換関数 `kakenProjectToDmpProjectInfo` を作成
   - TanStack Query (`useQuery`) でキャッシュ管理、`enabled: false` + 手動 `refetch` で検索ボタン押下時に発火
2. `ProjectInfoSection.tsx` に KAKEN 検索 UI を追加
   - セクションヘッダー下に「KAKEN番号で自動補完」入力欄 (`TextField`) と検索ボタンを追加
   - 検索成功時、上記マッピングで各フィールドを `setValue()` で自動補完
   - ローディング状態・エラー状態の表示

**注意事項**:
- `KakenApiClient` のファイルキャッシュ (`useCache`) はブラウザ環境では動作しないため **`useCache: false`** を指定する

**TDD**:
- `test/hooks/useKakenProject.test.ts` - フック単体テスト (モック使用)
  - `KakenApiClient` をモックし、各フィールドが正しくマッピングされることを確認

---

### タスク 3: GRDM パッケージ統合 (担当者情報・ファイルメタデータ同期)

**目的**: `@hirakinii-packages/grdm-api-typescript` を使い、GRDM固有のメタデータ(日本語氏名・ファイルサイズ等)を活用する

**対象ファイル**:
- `src/grdmClient.ts` (変更: `getMeResponseSchema` に日本語名フィールドを追加)
- `src/hooks/useUser.ts` (変更: `User` 型と `toUser` に日本語名を追加)
- `src/hooks/useFileMetadata.ts` (新規作成)
- `src/dmp.ts` (変更可能性: `PersonInfo.lastName/firstName` は日本語名を優先)

**現状の課題**:
- 既存 `User` インターフェースは `givenName` / `familyName` (英語名) のみ
- 既存 `getMeResponseSchema` に `given_name_ja` / `family_name_ja` フィールドなし
- `initDmp` は `user.familyName` / `user.givenName` を使用 → 英語名で初期化されてしまう

**作業内容**:
1. 日本語氏名対応 (担当者情報初期化の改善)
   - `getMeResponseSchema` に `given_name_ja` / `family_name_ja` を **optional** フィールドとして追加
   - `User` 型に `givenNameJa?: string | null` / `familyNameJa?: string | null` を追加
   - `toUser()` でこれらをマッピング
   - `initDmp()` で日本語名が存在する場合は優先、なければ英語名にフォールバック:
     ```typescript
     lastName: user.familyNameJa ?? user.familyName,
     firstName: user.givenNameJa ?? user.givenName,
     ```
2. ファイルメタデータ取得 (ファイルリンク時のサイズ表示)
   - `GrdmClient` を使い `fileMetadata.getByProject(projectId)` でファイルサイズを取得
   - `GrdmFileMetadataSchema` の `grdm-file:file-size` フィールドを利用
   - 既存の `FilesNode.attributes.size` が `null` の場合のフォールバック先として活用
   - `useFileMetadata` フックを作成し TanStack Query で管理

**方針の確定 (タスク1調査結果より)**:
- ノード操作・ファイル R/W・DMP R/W は **既存 `grdmClient.ts` を維持**
- `GrdmClient` は**ファイルメタデータ取得のみ**に限定して使用

---

### タスク 4: ROR API 統合 (データ管理機関サジェスト)

**目的**: `DataInfoSection.tsx` の「データ管理機関」フィールドを MUI Autocomplete + ROR API 検索に変更し、`rorId` を自動補完する

**対象ファイル**:
- `src/hooks/useRorSearch.ts` (新規作成)
- `src/components/EditProject/DataInfoSection.tsx` (変更)

**作業内容**:
1. `useRorSearch` カスタムフックの作成
   - ROR API (`https://api.ror.org/organizations?query=...`) を呼び出す
   - デバウンス処理 (300ms) でリアルタイム検索
2. `DataInfoSection.tsx` の `dataManagementAgency` フィールドを `TextField` から MUI `Autocomplete` に変更
   - 候補選択時に `dataManagementAgency` と `rorId` を自動補完
   - 自由入力も引き続き可能

**TDD**:
- `test/hooks/useRorSearch.test.ts` - フック単体テスト (fetch モック使用)

---

### タスク 5: 研究フェーズ別バリデーション (プログレッシブ・ディスクロージャー)

**目的**: 「計画時」「研究中」「報告時」という研究フェーズを DMP に追加し、フェーズに応じてバリデーションルールと表示項目を変化させる

**対象ファイル**:
- `src/dmp.ts` (変更: `researchPhase` フィールド追加、対象フィールドを optional 化)
- `src/components/EditProject/FormCard.tsx` (変更: フェーズセレクタ追加)
- `src/components/EditProject/DataInfoSection.tsx` (変更: 条件付きバリデーション)

**作業内容**:
1. `dmp.ts` に研究フェーズ型を追加:
   ```typescript
   export const researchPhases = ["計画時", "研究中", "報告時"] as const
   export type ResearchPhase = typeof researchPhases[number]
   ```
   `dmpMetadataSchema` に `researchPhase: z.enum(researchPhases).default("計画時")` を追加
2. `dataInfoSchema` のフェーズ依存フィールドを optional 化:
   - `repository`, `plannedPublicationDate`, `publicationDate` を `z.string().nullable().optional()` に変更
   - Zod レベルの必須バリデーションを外し、フォームレベルで動的に制御する
3. `FormCard.tsx` にフェーズセレクタ (MUI `ToggleButtonGroup`) を追加
   - `methods.setValue("metadata.researchPhase", phase)` で更新
4. `DataInfoSection.tsx` でフェーズに応じた React Hook Form バリデーション制御:

   | フィールド | 計画時 | 研究中 | 報告時 |
   |-----------|--------|--------|--------|
   | `repository` | 任意 | 任意 | 必須 |
   | `plannedPublicationDate` | 任意 | 任意 | 必須 |
   | `publicationDate` | 任意 | 必須 | 必須 |

   実装方法: `useWatch({ name: "metadata.researchPhase" })` でフェーズを監視し、
   `register("dataInfo.N.repository", { required: phase === "報告時" })` のように動的に rules を変更する

5. `readDmpFile` の後方互換性: `researchPhase` が未定義の場合は Zod の `.default("計画時")` が自動的にフォールバック

**TDD**:
- `test/components/DataInfoSection.test.tsx` にフェーズ切り替えテストを追加
  - フェーズ「計画時」→ `repository` が任意、フェーズ「報告時」→ `repository` が必須 を確認

---

### タスク 6: トースト通知の実装 (マイクロインタラクション)

**目的**: 保存成功・失敗・API 通信中などのシステム応答をユーザーに視覚的にフィードバックする

**対象ファイル**:
- `src/components/SnackbarProvider.tsx` (新規作成)
- `src/hooks/useSnackbar.ts` (新規作成)
- `src/App.tsx` (変更: Provider 追加)
- `src/components/EditProject/FormCard.tsx` (変更: 保存結果通知)

**作業内容**:
1. MUI `Snackbar` + `Alert` を使った通知コンポーネント作成
   - Context を使ってアプリ全体から呼び出せる `useSnackbar()` フックを提供
   - severity: `success` / `error` / `info`
   - auto-hide: 4秒後
2. `FormCard.tsx` の保存ボタン動作に通知を追加:
   - 保存成功: "DMPを保存しました" (success)
   - 保存失敗: "保存に失敗しました" (error)
3. KAKEN/ROR API 検索にも通知を追加:
   - 検索失敗: "情報の取得に失敗しました" (error)

**TDD**:
- `test/components/SnackbarProvider.test.tsx`

---

### タスク 7: 未保存変更の離脱警告

**目的**: 編集状態を監視し、保存せずにページを離れようとした際に警告ダイアログを表示してデータ消失を防ぐ

**対象ファイル**:
- `src/hooks/useUnsavedChangesWarning.ts` (新規作成)
- `src/pages/EditProject.tsx` (変更)

**作業内容**:
1. `useUnsavedChangesWarning` フック作成:
   - React Hook Form の `formState.isDirty` を監視
   - `beforeunload` イベントでブラウザ標準の離脱警告を表示
   - React Router v7 の `useBlocker` でSPA内ナビゲーション時に確認ダイアログを表示
2. `EditProject.tsx` にフックを組み込む
3. 保存完了後は `methods.reset(savedValues)` で dirty フラグをリセット

**TDD**:
- `test/hooks/useUnsavedChangesWarning.test.ts`

---

### タスク 8: E2E テスト (Playwright) 導入

**目的**: 重要なユーザーフローを自動テストで保護する

**対象ファイル**:
- `playwright.config.ts` (新規作成)
- `e2e/` ディレクトリ (新規作成)

**作業内容**:
1. Playwright をインストール (`npm install --save-dev @playwright/test`)
2. 以下のシナリオの E2E テストを実装:
   - ログイン → DMP 新規作成 → 保存 のフロー
   - 未保存遷移の警告表示確認
   - KAKEN 検索からの自動補完確認

---

## 実装順序と依存関係

```
タスク 1 (パッケージ調査)
  ├─→ タスク 2 (KAKEN統合)
  ├─→ タスク 3 (GRDMパッケージ統合)
  └─→ タスク 4 (ROR統合)

タスク 5 (研究フェーズ)  ← 独立して実装可能
タスク 6 (トースト通知) ← 独立して実装可能
タスク 7 (離脱警告)     ← 独立して実装可能
タスク 8 (E2E)         ← タスク 1-7 完了後
```

## 注意事項・リスク

| リスク | 対策 |
|--------|------|
| 外部パッケージのAPI仕様が不明 | タスク1でAPI調査を最優先、必要に応じて各タスクを修正 |
| `@hirakinii-packages/grdm-api-typescript` と既存 `grdmClient.ts` の重複 | パッケージ調査後に方針決定。既存コードは段階的に移行 |
| 後方互換性 (既存の保存済みDMPの読み込み) | `readDmpFile` で `researchPhase` 未定義時のフォールバック処理を実装 |
| `useBlocker` の React Router v7 での動作 | テストで動作確認後に実装 |
