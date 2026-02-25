# Issue #14 追加機能 実装計画

## 概要

Issue #14 の内部フィードバック対応として追加された 5 つの機能要求に対する実装計画。

---

## ユーザーからの機能要求

* トップページにて、 DMP export ボタンをプロジェクト一覧の右端に設定する。
* DMP export の JSPS 形式エクスポートにおいて、JSPS template である @src/templates/jsps_template.xlsx を読み込み、その「DMP様式例」シートを更新してエクスポートする。
* DMP の詳細ページを追加する。
* DMP 編集ページ内で、GRDM との連携におけるツリーはアコーディオンのようにたためるようにしておくべき。
* DMP 編集ページ内で、保存ボタンと Export ボタンはいつでもアクセスできるよう、ツールリストとして右か左にパネル化する。

---

## 機能要求一覧

| # | 機能 | 優先度 |
|---|------|--------|
| F1 | トップページのプロジェクト一覧右端に DMP Export ボタンを追加 | 高 |
| F2 | JSPS 形式エクスポートにおけるテンプレート xlsx の活用 | 高 |
| F3 | DMP 詳細ページの追加 | 中 |
| F4 | GRDM ファイルツリーのアコーディオン化 | 中 |
| F5 | 保存・Export ボタンの固定サイドパネル化 | 中 |

---

## 現状分析

### 関連ファイル

| ファイル | 役割 |
|----------|------|
| `src/components/Home/ProjectTable.tsx` | トップページのプロジェクト一覧テーブル |
| `src/jspsExport.ts` | JSPS 形式 Excel エクスポートロジック |
| `src/templates/jsps_template.xlsx` | JSPS テンプレートファイル（既存） |
| `src/components/EditProject/ExportDmpCard.tsx` | 編集ページの Export カード |
| `src/components/EditProject/GrdmCard.tsx` | GRDM 連携カード（ツリー含む） |
| `src/components/EditProject/FileTreeSection.tsx` | GRDM ファイルツリー |
| `src/components/EditProject/FormCard.tsx` | 保存ボタン含む編集フォームカード |
| `src/pages/EditProject.tsx` | DMP 編集ページ |
| `src/App.tsx` | ルーティング定義 |
| `src/grdmClient.ts` | GRDM API クライアント |
| `src/hooks/useDmp.ts` | DMP データ取得フック |

### 現状の課題

- `exportToJspsExcel()` はテンプレートを使わず `XLSX.utils.aoa_to_sheet` で白紙シートを生成している（コメント内に TODO あり）
- 保存ボタンは `FormCard.tsx` の末尾、Export ボタンは `ExportDmpCard.tsx` カード内にあり、スクロール位置によりアクセス不可
- GRDM ファイルツリーはプロジェクトノードが `SimpleTreeView` の TreeItem として実装されており、折りたたみ UI の視覚的なアフォーダンスが弱い
- DMP 詳細ページ（読み取り専用）が存在せず、一覧→編集のフローのみ

---

## タスク詳細

---

### タスク F1: トップページへの DMP Export ボタン追加　→　完了

**目的**: プロジェクト一覧の各行右端に「DMP を出力する」ボタンを追加し、一覧画面から直接 JSPS 形式でエクスポートできるようにする

**対象ファイル**:
- `src/components/Home/ProjectTable.tsx`（変更）

**現状のテーブルカラム構成**:
```
プロジェクト名 (40%) | 作成日 (20%) | 最終更新日 (20%) | [編集ボタン] (20%)
```

**変更後のカラム構成**:
```
プロジェクト名 (35%) | 作成日 (15%) | 最終更新日 (15%) | [編集] [Export▼] (35%)
```

**作業内容**:

1. `ProjectTableRow` コンポーネントに Export ボタンを追加
   - MUI `Button` variant="outlined" color="secondary"、`DownloadingOutlined` アイコン使用
   - 編集ボタンと同じセル（`TableCell`）内に横並びで配置
   - ボタンクリック時に DMP フォーマット選択メニューを表示（MUI `Menu`）
   - メニュー項目: 「サンプル形式」「JSPS 形式」

2. Export 処理の実装
   - クリック時に `readDmpFile(token, projectId)` を直接呼び出し DMP データを取得
   - 取得後に `exportToJspsExcel(dmp)` または `exportToExcel(dmp)` を呼び出してダウンロード
   - Recoil の `tokenAtom` から token を取得
   - `isExporting` 状態で二重クリック防止 + ローディング表示

3. エラーハンドリング
   - DMP ファイルが存在しない場合: `useSnackbar` で「DMP データが見つかりません」を表示
   - 通信エラー: `useSnackbar` で「エクスポートに失敗しました」を表示

**必要な型・関数のインポート**:
- `readDmpFile` from `@/grdmClient`
- `exportToJspsExcel` from `@/jspsExport`
- `exportToExcel` from `@/dmp`
- `useRecoilValue, tokenAtom`
- `useSnackbar` from `@/hooks/useSnackbar`

**TDD**:
- `test/components/Home/ProjectTable.test.tsx`（新規作成）
  - Export ボタンが各行にレンダリングされることを確認
  - クリック時にメニューが表示されることを確認
  - `readDmpFile` と `exportToJspsExcel` がモックされ、ファイルダウンロードが発火することを確認

---

### タスク F2: JSPS テンプレート xlsx を使ったエクスポート　→　完了

**目的**: 現在白紙から生成している JSPS Excel ファイルを、既存テンプレート `src/templates/jsps_template.xlsx` の「DMP様式例」シートにデータを書き込む形式に変更する。テンプレートの書式・マージセル・スタイルを保持したままデータを上書きする。

**対象ファイル**:
- `src/jspsExport.ts`（変更）
- `vite.config.ts`（確認・変更の可能性）

**実装方針**:

テンプレートファイルをブラウザで読み込む方法として Vite の静的アセット URL インポートを使用する:
```typescript
import templateUrl from '@/templates/jsps_template.xlsx?url'
```
これにより、ビルド時にファイルの URL が解決される。ランタイムで `fetch(templateUrl)` して `ArrayBuffer` として読み込み、`XLSX.read()` でパースする。

**変更内容**:

1. `exportToJspsExcel` を非同期関数に変更:
   ```typescript
   export async function exportToJspsExcel(dmp: Dmp): Promise<Blob>
   ```

2. テンプレートの読み込み処理を追加:
   ```typescript
   const res = await fetch(templateUrl)
   const buf = await res.arrayBuffer()
   const wb = XLSX.read(buf, { type: 'array', cellStyles: true, cellDates: true })
   ```

3. 「DMP様式例」シートを取得して既存セルにデータを書き込む:
   - `wb.Sheets['DMP様式例']` を取得
   - `XLSX.utils.sheet_add_aoa()` を使い、既存シートの特定セル範囲にデータを上書き
   - 既存の現在の `aoa` 構築ロジック（`buildPersonRows`, `buildDataRows`）は再利用

4. テンプレートのシート構造に合わせたセル位置マッピングを定義:
   - テンプレート xlsx を事前に調査し、各セクションの開始行・列を定数として定義する

5. 呼び出し元 (`ExportDmpCard.tsx`, タスク F1 の `ProjectTable.tsx`) を `await` に対応させる

**注意事項**:
- `XLSX.write()` 時は `{ bookType: 'xlsx', type: 'array' }` を維持
- テンプレートのセルスタイル・マージセルを破壊しないよう、`aoa_to_sheet` ではなく `sheet_add_aoa` または個別セル代入 (`ws['A1'] = { v: value }`) を使う

**TDD**:
- `test/jspsExport.test.ts`（既存テストがある場合は変更）
  - `fetch` をモックしてテンプレートの `ArrayBuffer` を返す
  - 返却された `Blob` が xlsx 形式であることを確認
  - シート名「DMP様式例」が存在することを確認
  - DMP データが正しいセルに書き込まれていることを確認

---

### タスク F3: DMP 詳細ページの追加　→　完了

**目的**: 各 DMP プロジェクトの内容を読み取り専用で表示する詳細ページを追加する。編集ページとは別の閲覧専用 UI を提供し、共有・確認用途に対応する。

**対象ファイル**:
- `src/pages/DetailProject.tsx`（新規作成）
- `src/App.tsx`（変更: ルート追加）
- `src/components/Home/ProjectTable.tsx`（変更: 詳細ページへのリンク追加）

**ルート設計**:
```
/projects/:projectId/detail  →  DetailProject ページ（読み取り専用）
/projects/:projectId          →  EditProject ページ（既存・変更なし）
```

`App.tsx` に追加:
```tsx
{ path: 'projects/:projectId/detail', element: <DetailProject /> },
```

**DetailProject ページの構成**:

```
Frame
└── OurCard (詳細情報カード)
    ├── ヘッダー: "DMP Project の詳細" + [編集ページへ] ボタン
    ├── DMP 作成・更新情報
    │   ├── DMP作成年月日
    │   └── DMP最終更新年月日
    ├── 研究課題情報（全フィールド）
    ├── 担当者情報（テーブル表示）
    └── 研究データ情報（テーブル表示）
```

**実装方針**:
- `useDmp(projectId)` でデータ取得
- 各フィールドは `Typography` + `Box` での読み取り専用表示（フォーム不使用）
- 「編集する」ボタン（`/projects/:projectId` へリンク）を右上に配置
- ローディング・エラー処理は `EditProject.tsx` と同様のパターン

**ProjectTable.tsx の変更**:
- プロジェクト名の `Link` クリックを GRDM へのリンクから詳細ページへのナビゲーションに変更
  （または詳細ページへのアイコンボタンを編集ボタンの隣に追加する形でもよい）
- GRDM 外部リンクは OpenInNew アイコンのみに縮小して残す

**TDD**:
- `test/pages/DetailProject.test.tsx`（新規作成）
  - `useDmp` モック使用
  - DMP データが表示されることを確認
  - 「編集する」ボタンが正しい href を持つことを確認

---

### タスク F4: GRDM ファイルツリーのアコーディオン化

**目的**: `FileTreeSection.tsx` 内のプロジェクト別ファイルツリーを MUI `Accordion` で囲み、プロジェクト単位で折りたたみ可能にする。複数 GRDM プロジェクトが連携されている場合の可読性を向上させる。

**対象ファイル**:
- `src/components/EditProject/FileTreeSection.tsx`（変更）

**現状の構造**:
```
Card
└── SimpleTreeView
    ├── TreeItem (project A)
    │   └── TreeItem (file/folder...)
    └── TreeItem (project B)
        └── TreeItem (file/folder...)
```

**変更後の構造**:
```
Box
├── Accordion (project A, defaultExpanded)
│   ├── AccordionSummary: プロジェクト名 + FolderSpecialOutlined
│   └── AccordionDetails
│       └── SimpleTreeView (project A のファイルツリーのみ)
└── Accordion (project B)
    ├── AccordionSummary: プロジェクト名
    └── AccordionDetails
        └── SimpleTreeView (project B のファイルツリーのみ)
```

**実装内容**:

1. `tree` の各プロジェクトノード（`type === 'project'`）を `Accordion` でラップ
   - `AccordionSummary` にプロジェクト名と `FolderSpecialOutlined` アイコン、`ExpandMoreIcon` を表示
   - `AccordionDetails` に当該プロジェクトの `SimpleTreeView` を表示
   - `defaultExpanded` は最初のプロジェクトのみ `true`、それ以外は `false`

2. `expanded` と `handleToggle` は各 `SimpleTreeView` ごとに個別に管理
   - `expandedMap: Record<string, string[]>` という state で projectId ごとに管理する

3. アコーディオン展開時のファイルツリー初期ロード
   - アコーディオンが初めて展開された時に、そのプロジェクトのルートファイルを取得（現在の `handleToggle` ロジックを流用）

4. 全プロジェクトが未連携の場合のフォールバック表示は現状維持

**TDD**:
- `test/components/EditProject/FileTreeSection.test.tsx`（新規作成または変更）
  - Accordion が各プロジェクトに対してレンダリングされることを確認
  - AccordionSummary にプロジェクト名が表示されることを確認
  - 展開・折りたたみの動作確認

---

### タスク F5: 保存・Export ボタンの固定サイドパネル化

**目的**: 編集ページで長いフォームをスクロールしても常に「保存」「Export」ボタンにアクセスできるよう、固定位置のサイドパネル（アクションツールリスト）を追加する。

**対象ファイル**:
- `src/components/EditProject/ActionPanel.tsx`（新規作成）
- `src/pages/EditProject.tsx`（変更）
- `src/components/EditProject/FormCard.tsx`（保存ボタンの扱いを検討）
- `src/components/EditProject/ExportDmpCard.tsx`（Export カードの扱いを検討）

**UI 設計**:

```
[左端のページ端 or 右端に固定]

┌─────────┐
│  💾      │  ← 保存する
│ 保存     │
├─────────┤
│  📥      │  ← DMP を出力する (▼メニュー)
│ Export  │
└─────────┘
```

- MUI `Paper` + `position: fixed` を使用した縦型ボタンリスト
- 右端 (`right: 16px`) か左端 (`left: 16px`) に配置（画面幅に応じて検討）
- `top: 50%` + `transform: translateY(-50%)` で縦方向の中央揃え
- 各ボタンは `IconButton` + ツールチップ or `Button` の縦並び
- パネルの `zIndex` は `theme.zIndex.fab` 程度に設定

**ActionPanel コンポーネントの props**:
```typescript
interface ActionPanelProps {
  onSave: () => void
  isSaving: boolean
  isSaveDisabled: boolean
  // Export は ExportDmpCard の handleDownload ロジックを流用
}
```

**実装内容**:

1. `ActionPanel.tsx` の作成
   - 保存ボタン: `SaveOutlined` アイコン + "保存" ラベル、`onClick` で `onSave` 呼び出し
   - Export ボタン: `DownloadingOutlined` アイコン + "Export" ラベル、クリックで `Menu` 表示
     - メニュー項目: 「サンプル形式」「JSPS 形式」
   - 各ボタンは `Tooltip` でホバー時に説明表示

2. `EditProject.tsx` での組み込み
   - `FormProvider` 内に `ActionPanel` を配置
   - Save の `onSubmit` ハンドラを `ActionPanel` に渡すため、`useFormContext` を活用
   - または `ActionPanel` 自体が `useFormContext` を使って `handleSubmit` を呼ぶ

3. 既存ボタンの方針
   - `FormCard.tsx` の保存ボタンは **残す**（アクセシビリティ・フォームのセマンティクスのため）
   - `ExportDmpCard.tsx` は **残す**
   - `ActionPanel` はこれらへの「ショートカット」として機能する

4. レスポンシブ対応
   - 画面幅が狭い場合（`xs` breakpoint）は `ActionPanel` を非表示にする
   - `useMediaQuery` で制御

**TDD**:
- `test/components/EditProject/ActionPanel.test.tsx`（新規作成）
  - パネルがレンダリングされることを確認
  - 保存ボタンクリック時に `onSave` が呼び出されることを確認
  - Export ボタンクリック時にメニューが表示されることを確認

---

## 実装順序と依存関係

```
F2 (JSPSテンプレート)   ← F1 の Export 処理で使用するため先に実装
  └─→ F1 (トップページ Export ボタン)

F3 (詳細ページ)        ← 独立（ルート追加のみで他タスクと干渉なし）

F4 (ツリーアコーディオン) ← 独立（FileTreeSection のみ変更）

F5 (サイドパネル)       ← 独立（新規コンポーネント追加のみ）
```

**推奨実施順序**: F2 → F1 → F3 → F4 → F5

---

## 変更ファイル一覧まとめ

| ファイル | 変更種別 | 関連タスク |
|----------|----------|-----------|
| `src/components/Home/ProjectTable.tsx` | 変更 | F1, F3 |
| `src/jspsExport.ts` | 変更（非同期化・テンプレート使用） | F2 |
| `src/components/EditProject/ExportDmpCard.tsx` | 変更（await 対応） | F2 |
| `src/pages/DetailProject.tsx` | 新規作成 | F3 |
| `src/App.tsx` | 変更（ルート追加） | F3 |
| `src/components/EditProject/FileTreeSection.tsx` | 変更（Accordion化） | F4 |
| `src/components/EditProject/ActionPanel.tsx` | 新規作成 | F5 |
| `src/pages/EditProject.tsx` | 変更（ActionPanel追加） | F5 |

---

## セキュリティチェック

- ユーザー入力はすべて Zod スキーマ（`dmpSchema`）でバリデーション済み（変更なし）
- テンプレート xlsx の読み込みは静的アセット URL 経由（外部 URL なし）
- `readDmpFile` の token は既存の認証フロー（`tokenAtom`）を使用
- Excel 出力データは DMP フォームデータのみを使用（インジェクションリスクなし）

---

## テストカバレッジ目標

各タスクのテストを追加し、全体の vitest カバレッジ 80% 以上を維持する。
