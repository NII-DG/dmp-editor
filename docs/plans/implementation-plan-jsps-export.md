# JSPS DMP エクスポート機能 実装計画

## 概要

科学研究費助成事業（JSPS）の DMP 様式例 (`src/templates/jsps_template.xlsx`) に準拠した
Excel ファイルをエクスポートする機能を追加する。

あわせて、DMP の担当者情報（`personInfo`）に **連絡先（メールアドレス）** フィールドを追加する。

---

## 現状分析

### 既存のエクスポート機能

- `src/dmp.ts` の `exportToExcel(dmp: Dmp): Blob` が実装済み
- 4 シート構成（DMP作成・更新情報 / プロジェクト情報 / 担当者情報 / 研究データ情報）
- `src/components/EditProject/ExportDmpCard.tsx` が UI 側で呼び出している

### JSPS テンプレートの構造（`DMP様式例` シート）

単一シートに 4 つのセクションが縦に並ぶ構造（A〜N 列、39 行）。

| 行      | 内容                              |
| ------- | --------------------------------- |
| 1       | タイトル                          |
| 2–3     | 注意書き                          |
| 4       | **セクション 1**: DMP作成・更新情報 |
| 5       | DMP作成年月日（値: C 列）          |
| 6       | DMP最終更新年月日（値: C 列）      |
| 7       | （空行）                          |
| 8       | **セクション 2**: 研究課題情報      |
| 9       | 研究課題番号（値: C 列）           |
| 10      | （空行）                          |
| 11      | **セクション 3**: 担当者情報        |
| 12      | ヘッダー行                        |
| 13      | 研究代表者（固定 1 行）            |
| 14–15   | 研究分担者（固定 2 行）            |
| 16–17   | 研究データの取得者又は収集者（固定 2 行） |
| 18      | 研究開発データの管理責任者（固定 1 行）  |
| 19      | （空行）                          |
| 20      | **セクション 4**: 研究データ情報    |
| 21      | ヘッダー行                        |
| 22–26   | データ行（テンプレートは 5 行定義）  |

---

## フィールドマッピング

### セクション 1・2（固定セル）

| JSPS ラベル          | DMP フィールド                   |
| -------------------- | -------------------------------- |
| DMP作成年月日         | `dmp.metadata.dateCreated`       |
| DMP最終更新年月日     | `dmp.metadata.dateModified`      |
| 研究課題番号          | `dmp.projectInfo.projectCode`    |

### セクション 3: 担当者情報

#### 通し番号の付与ルール

`dmp.personInfo` 配列の **インデックス順**（0-based）に基づいて通し番号を付与する。

- インデックス 0 の担当者 → ①
- インデックス 1 の担当者 → ②
- インデックス 2 の担当者 → ③
- …

#### ロール名の変換（DMP → JSPS）

| DMP `personRole` 値             | JSPS テンプレートラベル                |
| ------------------------------- | -------------------------------------- |
| `研究代表者`                    | 研究代表者                             |
| `研究分担者`                    | 研究分担者                             |
| `管理対象データの作成者`         | 研究データの取得者又は収集者           |
| `管理対象データの管理責任者`     | 研究開発データの管理責任者             |

> 担当者は複数のロールを持つ場合がある。JSPS テンプレートでは 1 人が複数行に現れる（ロールごとに 1 行）。

#### 担当者行の列マッピング

| 列  | JSPS ラベル            | DMP フィールド                                         |
| --- | ---------------------- | ------------------------------------------------------ |
| B   | （ロール名）           | 上記ロール名変換テーブルに基づく                       |
| C   | 本計画書内通し番号     | ①②③...（`personInfo` 配列インデックス + 1）            |
| D   | 氏名                   | `${person.lastName} ${person.firstName}`               |
| E–F | 所属・役職（結合）     | `person.affiliation`                                   |
| G   | 研究者番号             | `person.eRadResearcherId`（未入力時は空欄）            |
| H   | 連絡先                 | `person.contact`（新規追加フィールド）                 |

#### 担当者行の生成ルール

出力順序はロール順（研究代表者 → 研究分担者 → 研究データの取得者又は収集者 → 研究開発データの管理責任者）を維持する。
各ロールに該当する担当者を `personInfo` 配列から抽出して行を生成する。

### セクション 4: 研究データ情報

| 列  | JSPS ラベル                              | DMP フィールド                                         |
| --- | ---------------------------------------- | ------------------------------------------------------ |
| A   | No.                                      | 1 始まりインデックス                                   |
| B   | 研究データの名称                         | `dataInfo.dataName`                                    |
| C   | 研究データの概要                         | `dataInfo.description`                                 |
| D   | 研究データの取得者又は収集者             | `dataInfo.dataCreator`（数値 → ①②... 変換）            |
| E   | 研究データの管理者（取得者と異なる場合） | `dataInfo.dataManager`                                 |
| F   | 機微情報がある場合の取り扱い方針         | `dataInfo.sensitiveDataPolicy`                         |
| G   | 研究データの公開・提供方針               | `dataInfo.accessRights`                                |
| H   | 研究データの公開・提供方針詳細           | `dataInfo.publicationPolicy`                           |
| I   | 研究データの公開・提供場所（URL・DOI）   | `dataInfo.repository`                                  |
| J   | 研究データ公開日（予定日）               | `dataInfo.plannedPublicationDate`                      |

> `dataCreator` は DMP スキーマでは `number | null | undefined` 型（担当者の 1-based インデックス）。
> 出力時は 1 → `①`、2 → `②` のように丸数字に変換する。

---

## 実装方針

### アプローチ: スクラッチ生成方式

テンプレートファイルを動的に読み込んで cell-by-cell で書き込む方式ではなく、
テンプレートのレイアウトを再現した配列データを `xlsx` ライブラリで新規シートとして生成する。

**採用理由**:
- `xlsx` ライブラリのフリー版はセルスタイルの読み書きに制限があり、
  テンプレートのスタイルを保持したまま編集するコストが高い
- 非同期 fetch なしで同期処理にできる（既存 `exportToExcel` と同じインターフェース）
- 担当者数・データ数に応じて動的に行を増減できる

**制約**: セルの背景色・ボーダー等のスタイルは再現しない（構造・項目名のみ再現）。

---

## 実装対象ファイル

### 変更（スキーマ・ロジック）

| ファイル            | 変更内容                                                       |
| ------------------- | -------------------------------------------------------------- |
| `src/dmp.ts`        | `personInfoSchema` に `contact` フィールドを追加               |
|                     | `initPersonInfo()` の初期値に `contact` を追加                 |
|                     | `exportToExcel()` の担当者情報シートに連絡先列を追加           |

### 変更（UI）

| ファイル                                             | 変更内容                                             |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `src/components/EditProject/PersonInfoSection.tsx`   | `formData` に連絡先フィールドを追加                  |
|                                                      | テーブルヘッダー・行に連絡先列を追加                 |
| `src/components/EditProject/ExportDmpCard.tsx`       | JSPS 形式エクスポートボタンを追加                    |

### 新規作成

| ファイル                    | 役割                             |
| --------------------------- | -------------------------------- |
| `src/jspsExport.ts`         | JSPS 形式エクスポートロジック    |
| `test/jspsExport.test.ts`   | ユニットテスト                   |

---

## 詳細実装仕様

### Step 1: `src/dmp.ts` の変更

#### `personInfoSchema` に `contact` を追加

```typescript
export const personInfoSchema = z.object({
  role: z.array(z.enum(personRole)),
  lastName: z.string(),
  firstName: z.string(),
  eRadResearcherId: z.string().nullable().optional(),
  orcid: z.string().nullable().optional(),
  affiliation: z.string(),
  contact: z.string().nullable().optional(), // Added: email address
})
```

#### `initPersonInfo()` の変更

```typescript
export const initPersonInfo = (): PersonInfo => ({
  role: [],
  lastName: "",
  firstName: "",
  eRadResearcherId: undefined,
  orcid: undefined,
  affiliation: "",
  contact: undefined, // Added
})
```

#### `exportToExcel()` の担当者情報シート変更

```typescript
const personInfoHeader = ["", "本計画書内通し番号", "姓", "名", "e-Rad 研究者番号", "ORCID", "所属機関", "連絡先"]
// ...
personInfoData.push([
  role,
  "",
  person.lastName,
  person.firstName,
  person.eRadResearcherId ?? "",
  person.orcid ?? "",
  person.affiliation,
  person.contact ?? "",   // Added
])
```

### Step 2: `src/components/EditProject/PersonInfoSection.tsx` の変更

#### `formData` 配列に連絡先を追加

`affiliation` の後ろに追加する：

```typescript
{
  key: "contact",
  label: "連絡先（メールアドレス）",
  required: false,
  type: "text",
},
```

#### テーブルヘッダーの変更

現在の `["役割", "名前", "e-Rad 研究者番号", "ORCID", "所属機関", ""]` に
`"連絡先"` を追加する（所属機関の後）。

#### テーブル行の変更

`TableCell` に `personInfo.contact ?? ""` の列を追加する。

### Step 3: `src/jspsExport.ts` の新規作成

```typescript
import * as XLSX from "xlsx"
import type { Dmp } from "@/dmp"
import { personRole } from "@/dmp"

/** Circled number characters ①–⑳ */
const CIRCLED_NUMBERS = [
  "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳",
]

/** Convert 1-based index to circled number string */
export function toCircledNumber(n: number): string {
  return CIRCLED_NUMBERS[n - 1] ?? String(n)
}

/** Mapping from DMP personRole to JSPS role label */
const JSPS_ROLE_LABELS: Record<string, string> = {
  "研究代表者": "研究代表者",
  "研究分担者": "研究分担者",
  "管理対象データの作成者": "研究データの取得者又は収集者",
  "管理対象データの管理責任者": "研究開発データの管理責任者",
}

/** Build person info rows for section 3.
 *  Rows are grouped by JSPS role order. Within each role, persons are listed
 *  in the order they appear in dmp.personInfo (= their serial number order).
 */
export function buildPersonRows(dmp: Dmp): (string | number)[][] { ... }

/** Build data info rows for section 4. */
export function buildDataRows(dmp: Dmp): (string | number)[][] { ... }

/** Export DMP as JSPS-format Excel (single sheet: DMP様式例) */
export function exportToJspsExcel(dmp: Dmp): Blob { ... }
```

#### `buildPersonRows` ロジック

1. `personRole` の順序（`["研究代表者", "研究分担者", "管理対象データの作成者", "管理対象データの管理責任者"]`）でループ
2. 各ロールに対して、`dmp.personInfo` から `person.role.includes(role)` の担当者を抽出
3. 各担当者について以下の行を生成:
   ```
   ["", jspsLabel, toCircledNumber(index+1), `${lastName} ${firstName}`, affiliation, "", eRadId, contact]
   ```
   - `index` は `dmp.personInfo` 配列における 0-based インデックス
4. 各ロールに該当者がいない場合は 1 行の空行を生成（ラベルのみ）

#### `buildDataRows` ロジック

`dmp.dataInfo` の各要素を以下の列順で行に変換する:

```
[no, dataName, description, creatorRef, manager, sensitivePolicy, accessRights, pubPolicy, repository, plannedPubDate]
```

- `creatorRef`: `dataCreator` が数値なら `toCircledNumber(dataCreator)`、それ以外は `""`

#### `exportToJspsExcel` シート構築

以下の配列を結合して `aoa` (Array of Arrays) を作成する:

```
行 1  : ["科学研究費助成事業データマネジメントプラン（DMP）様式例", "", ...(13 cols)]
行 2  : ["", "", "※研究の進捗に応じ、個別の研究データごとの記述を追記・更新すること※", ...]
行 3  : ["", "", "※本様式例の項目の内容に沿っていれば、本様式以外を用いても差し支えない※", ...]
行 4  : ["1. DMP作成・更新情報", ...]
行 5  : ["", "DMP作成年月日", dateCreated, ...]
行 6  : ["", "DMP最終更新年月日", dateModified, ...]
行 7  : (空行)
行 8  : ["2. 研究課題情報", ...]
行 9  : ["", "研究課題番号", projectCode, ...]
行 10 : (空行)
行 11 : ["3. 担当者情報", ...]
行 12 : ["", "", "本計画書内通し番号", "氏名", "所属・役職", "", "研究者番号\n※該当がない場合は空欄可", "連絡先", ...]
...buildPersonRows(dmp)...
(空行)
["4. 研究データ情報", ...]
["No.", "研究データの名称", "研究データの概要", "研究データの取得者又は収集者",
 "研究データの管理者\n※取得者又は収集者と異なる場合のみ記入",
 "機微情報がある場合の取り扱い方針", "研究データの公開・提供方針",
 "研究データの公開・提供方針詳細", "研究データの公開・提供場所\n（URL、DOI）",
 "研究データ公開日（予定日）", ...]
...buildDataRows(dmp)...
```

シート名: `DMP様式例`

### Step 4: `src/components/EditProject/ExportDmpCard.tsx` の変更

- `exportToJspsExcel` をインポート
- `isJspsDownloading` state を追加
- 「JSPS 形式で出力」ボタンを追加（ファイル名: `jsps_dmp.xlsx`）

---

## テスト計画

### `test/jspsExport.test.ts`

```typescript
import { describe, it, expect } from "vitest"
import * as XLSX from "xlsx"
import { exportToJspsExcel, toCircledNumber, buildPersonRows, buildDataRows } from "../src/jspsExport"
import { initDmp, initDataInfo, initPersonInfo } from "../src/dmp"
import type { Dmp } from "../src/dmp"

// Helper: parse Blob to sheet rows
async function parseSheet(blob: Blob): Promise<string[][]> {
  const buffer = await blob.arrayBuffer()
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets["DMP様式例"]
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" })
}
```

#### テストケース一覧

| #  | 対象関数           | テスト内容                                                                   |
| -- | ------------------ | ---------------------------------------------------------------------------- |
| 1  | `toCircledNumber`  | 1 → `①`、10 → `⑩`、20 → `⑳`                                                |
| 2  | `toCircledNumber`  | 21 以上は文字列の数字を返す                                                  |
| 3  | `buildPersonRows`  | 研究代表者のロール名が `研究代表者` で出力される                             |
| 4  | `buildPersonRows`  | `管理対象データの作成者` が `研究データの取得者又は収集者` に変換される      |
| 5  | `buildPersonRows`  | `管理対象データの管理責任者` が `研究開発データの管理責任者` に変換される    |
| 6  | `buildPersonRows`  | 通し番号が `personInfo` 配列インデックス順に ①②③ で付与される               |
| 7  | `buildPersonRows`  | 複数ロールを持つ担当者が各ロールで別々の行に出力される                       |
| 8  | `buildPersonRows`  | 連絡先（contact）が H 列に出力される                                         |
| 9  | `buildPersonRows`  | 該当者がいないロールは空行 1 行が生成される                                  |
| 10 | `buildDataRows`    | `dataCreator` の数値が丸数字に変換される                                     |
| 11 | `buildDataRows`    | `dataCreator` が null/undefined の場合は空欄                                |
| 12 | `buildDataRows`    | 全フィールドが正しい列順で出力される                                         |
| 13 | `exportToJspsExcel`| Blob が生成される（MIME type チェック）                                      |
| 14 | `exportToJspsExcel`| シート名が `DMP様式例` である                                                |
| 15 | `exportToJspsExcel`| セクション 1: dateCreated・dateModified が正しい行に出力される               |
| 16 | `exportToJspsExcel`| セクション 2: projectCode が正しい行に出力される                             |
| 17 | `exportToJspsExcel`| データ項目が 5 件を超えても全行出力される                                    |
| 18 | `exportToJspsExcel`| データなし（空 DMP）でも Blob が生成される                                   |

### 既存テストへの影響

`test/dmp.test.ts` には `initPersonInfo` や `personInfoSchema` の直接テストはないが、
`initDmp` のテストで `personInfo` を検証している箇所があるため、影響がないか確認する。

---

## 実装ステップ（TDD）

### Step 1: `src/dmp.ts` の変更（スキーマ追加）

1. `personInfoSchema` に `contact` を追加
2. `initPersonInfo()` に `contact: undefined` を追加
3. `exportToExcel()` の担当者情報シートに連絡先列を追加
4. `npm run test:vitest` で既存テストが通ることを確認

### Step 2: `src/components/EditProject/PersonInfoSection.tsx` の変更

1. `formData` に連絡先フィールドを追加
2. テーブルヘッダー・行に連絡先列を追加

### Step 3: `test/jspsExport.test.ts` の作成（RED）

上記テストケースをすべて実装し、テストが失敗することを確認する。

### Step 4: `src/jspsExport.ts` の実装（GREEN）

`toCircledNumber`、`buildPersonRows`、`buildDataRows`、`exportToJspsExcel` を実装し、
すべてのテストが通ることを確認する。

### Step 5: `src/components/EditProject/ExportDmpCard.tsx` の変更

JSPS 形式エクスポートボタンを追加する。

### Step 6: 全体確認

```bash
npm run ci
```

lint・typecheck・vitest・build がすべて通ることを確認する。
