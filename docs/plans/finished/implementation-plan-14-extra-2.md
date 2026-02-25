# Issue #14 追加機能 実装計画 (Extra 2)

## 概要

DMP Project の編集・新規作成ページは現状縦に長いフォームとなっている。
これをセクションごとに分離し、「セクション 1 → セクション 2 → …」のように
ステップ形式で遷移できるウィザード UI に変換する。

MUI の `Stepper` コンポーネントを活用し、ユーザーが各セクションを順に入力・確認できるようにする。

---

## 現状分析

### 現状のページ構成

`EditProject.tsx` が以下の 3 つのカードを縦に並べて表示している:

```
EditProject.tsx
├── FormCard.tsx         ← 全フォームセクションを含む長い縦スクロールカード
│   ├── 研究フェーズ切り替え
│   ├── GrdmProject (GRDM プロジェクト連携設定)
│   ├── DmpMetadataSection (DMP 作成・更新情報)
│   ├── ProjectInfoSection (プロジェクト情報)
│   ├── PersonInfoSection (担当者情報)
│   ├── DataInfoSection (研究データ情報)
│   └── 保存ボタン
├── GrdmCard.tsx         ← GRDM ファイルツリー・プロジェクト関連付け
│   ├── ProjectTableSection (GRDM プロジェクト関連付けテーブル)
│   └── FileTreeSection (GRDM ファイルツリー)
└── ExportDmpCard.tsx    ← DMP 出力カード
```

### 問題点

- 全セクションが 1 ページに縦に並び、スクロール量が多い
- `FormCard` と `GrdmCard` が別カードに分かれており、UI の一貫性が低い
- 保存ボタンがページ末尾にしかなく、スクロール操作が必要

---

## ゴール

- 全セクションを 5 ステップに分割し、`Stepper` ナビゲーションで遷移
- 「次へ」ボタンを押すたびに現在ステップのバリデーションを実行
- どのステップでも保存ボタンにアクセス可能
- `GrdmCard` の内容を FormCard のステップに統合し、カード構成をシンプル化

---

## ステップ構成

| # | ステップタイトル | 含まれるセクション |
|---|----------------|------------------|
| 1 | 基本設定       | 研究フェーズ切り替え + GrdmProject (GRDM プロジェクト名入力) + DmpMetadataSection |
| 2 | プロジェクト情報 | ProjectInfoSection (資金配分機関・プロジェクト名等) |
| 3 | 担当者情報     | PersonInfoSection (担当者テーブル) |
| 4 | 研究データ情報  | DataInfoSection (研究データテーブル) |
| 5 | GRDM 連携     | ProjectTableSection (GRDM 関連付け) + FileTreeSection (ファイルツリー) |

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `src/components/EditProject/FormCard.tsx` | **大規模変更** | Stepper ベースのウィザード UI にリファクタリング |
| `src/pages/EditProject.tsx` | **変更** | `GrdmCard` の削除（内容は FormCard ステップ 5 に統合） |
| `src/components/EditProject/GrdmCard.tsx` | **削除** | 内容が FormCard のステップ 5 に移行されるため不要 |

`ExportDmpCard.tsx`、各セクションコンポーネント、`GrdmProject.tsx` は変更なし。

---

## 実装詳細

### タスク W1: `FormCard.tsx` の Stepper 対応

#### ステップ定義

```typescript
const STEPS = [
  { label: '基本設定' },
  { label: 'プロジェクト情報' },
  { label: '担当者情報' },
  { label: '研究データ情報' },
  { label: 'GRDM 連携' },
] as const
```

#### 追加する State

```typescript
const [activeStep, setActiveStep] = useState(0)
```

#### ステップ別バリデーションフィールド

「次へ」ボタン押下時に `trigger()` で部分バリデーションを実行する。

```typescript
const STEP_FIELDS: Record<number, FieldPath<DmpFormValues>[]> = {
  0: [
    'grdmProjectName',
    'dmp.metadata.revisionType',
    'dmp.metadata.submissionDate',
    'dmp.metadata.dateCreated',
    'dmp.metadata.dateModified',
  ],
  1: [
    'dmp.projectInfo.fundingAgency',
    'dmp.projectInfo.projectCode',
    'dmp.projectInfo.projectName',
  ],
  2: [],  // PersonInfoSection: ダイアログ内フォームで個別バリデーション済み
  3: [],  // DataInfoSection: ダイアログ内フォームで個別バリデーション済み
  4: [],  // GRDM 連携: バリデーション不要
}
```

#### ナビゲーションボタンの動作

| ボタン | 表示条件 | 動作 |
|-------|---------|-----|
| 前へ | Step 2〜5 | `setActiveStep(prev => prev - 1)` |
| 次へ | Step 1〜4 | `trigger(STEP_FIELDS[activeStep])` → 成功時 `setActiveStep(prev => prev + 1)` |
| 保存する | 常時表示 | `handleSubmit(onSubmit)`（全フィールドバリデーション実行） |

保存ボタンは全ステップで常時表示する。
バリデーションエラーがある場合、エラーのあるフィールドが存在するステップに自動でジャンプする実装（任意対応）。

#### UI レイアウト

```tsx
<OurCard sx={sx}>
  <Box component="form" onSubmit={handleSubmit(onSubmit)}>

    {/* ページタイトル */}
    <Typography component="h1">DMP Project の{isNew ? '新規作成' : '編集'}</Typography>

    {/* Stepper ナビゲーション（水平・ノンリニア） */}
    <Stepper activeStep={activeStep} alternativeLabel nonLinear sx={{ mt: '1.5rem' }}>
      {STEPS.map((step, i) => (
        <Step key={step.label} completed={i < activeStep}>
          <StepButton onClick={() => setActiveStep(i)}>
            {step.label}
          </StepButton>
        </Step>
      ))}
    </Stepper>

    {/* アクティブなステップのコンテンツ */}
    <Box sx={{ mt: '2rem' }}>
      {activeStep === 0 && (
        <>
          {/* 研究フェーズ切り替え（現行 FormCard 内の ToggleButtonGroup） */}
          <ToggleButtonGroup ... />
          <GrdmProject sx={{ mt: '1rem' }} isNew={isNew} project={project} projects={projects} />
          <DmpMetadataSection sx={{ mt: '1.5rem' }} />
        </>
      )}
      {activeStep === 1 && <ProjectInfoSection />}
      {activeStep === 2 && <PersonInfoSection />}
      {activeStep === 3 && <DataInfoSection user={user} projects={projects} />}
      {activeStep === 4 && (
        <>
          <ProjectTableSection user={user} projects={projects} />
          <Divider sx={{ my: '1.5rem' }} />
          <FileTreeSection projects={projects} />
        </>
      )}
    </Box>

    {/* ナビゲーションボタン */}
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '1rem', mt: '2rem', alignItems: 'center' }}>
      <Button
        variant="outlined"
        onClick={handleBack}
        disabled={activeStep === 0}
      >
        前へ
      </Button>
      {activeStep < STEPS.length - 1 && (
        <Button variant="contained" onClick={handleNext}>
          次へ
        </Button>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        color="secondary"
        type="submit"
        startIcon={<SaveOutlined />}
        disabled={isButtonDisabled()}
      >
        {buttonLabel()}
      </Button>
    </Box>

  </Box>
</OurCard>
```

#### `handleNext` 関数

```typescript
const handleNext = async () => {
  const fields = STEP_FIELDS[activeStep]
  const valid = fields.length > 0 ? await trigger(fields) : true
  if (valid) {
    setActiveStep((prev) => prev + 1)
  }
}

const handleBack = () => {
  setActiveStep((prev) => prev - 1)
}
```

#### `FormCard` への追加インポート

```typescript
import { Stepper, Step, StepButton } from '@mui/material'
import ProjectTableSection from '@/components/EditProject/ProjectTableSection'
import FileTreeSection from '@/components/EditProject/FileTreeSection'
```

現行 `FormCard.tsx` の `GrdmCard` インポートは不要になる（`GrdmCard` は `EditProject.tsx` からも削除）。

---

### タスク W2: `EditProject.tsx` の変更

`GrdmCard` の import と使用を削除する。

#### 変更前

```tsx
import GrdmCard from "@/components/EditProject/GrdmCard"
...
<GrdmCard sx={{ mt: "1.5rem" }} user={userQuery.data!} projects={projectsQuery.data!} />
```

#### 変更後

上記 2 箇所を削除する。
`ExportDmpCard` は従来通り `FormCard` の下に残す。

---

### タスク W3: `GrdmCard.tsx` の削除

`GrdmCard.tsx` は `FormCard` のステップ 5 に内容が移行されるため削除する。

ただし、削除前に参照箇所がないことを確認する:
- `grep -r "GrdmCard" src/` でインポートが 0 件であること

---

## ステップ間バリデーションエラーの扱い

「保存する」ボタン押下時に全フィールドのバリデーションが走り、
エラーがある場合はエラーが存在する最初のステップに自動ジャンプする（実装難度: 中）。

**必須実装**:
- 保存時にエラーがある場合 `useSnackbar` で「入力内容に誤りがあります」を表示

**任意実装**（計画段階では対応しない場合は省略可）:
- エラーがあるステップ番号を計算して `setActiveStep` でジャンプ

---

## TDD 計画

### テスト対象: `test/components/EditProject/FormCard.test.tsx`

既存テストがある場合は拡張、なければ新規作成。

| テストケース | 内容 |
|------------|------|
| Stepper が 5 ステップ分レンダリングされる | ステップラベルが全て表示されること |
| 初期表示はステップ 1 のコンテンツ | `DmpMetadataSection` が表示されていること |
| 「次へ」でステップ 2 に遷移する | バリデーション成功後にステップ 2 のコンテンツが表示されること |
| バリデーションエラー時は遷移しない | 必須フィールド未入力時に次へ押下してもステップが変わらないこと |
| 「前へ」でステップ 1 に戻る | ステップ 2 から「前へ」でステップ 1 に戻ること |
| ステップラベルのクリックでジャンプできる | ステップ 3 ラベルをクリックするとステップ 3 に遷移すること |
| 保存ボタンが全ステップで表示される | ステップ 1〜5 それぞれで保存ボタンが存在すること |
| 保存ボタン押下時に `onSubmit` が呼ばれる | `handleSubmit` モック経由で呼び出しを確認 |
| ステップ 5 に GRDM 連携コンテンツが表示される | `ProjectTableSection` が表示されること |

---

## 実装順序

```
W1 (FormCard Stepper 化)
  └─→ W2 (EditProject から GrdmCard 削除)
        └─→ W3 (GrdmCard.tsx 削除)
```

**推奨実施順序**: W1 → W2 → W3

W1 完了 → テスト確認 → W2 → W3 の順で進める。

---

## セキュリティチェック

- フォームデータは既存の Zod スキーマ (`dmpSchema`) でバリデーション済み（変更なし）
- ステップ UI の追加は状態管理の変更のみであり、新たなセキュリティリスクはない
- GRDM API 呼び出しは既存フックを流用（変更なし）

---

## テストカバレッジ目標

上記 TDD 計画を実施し、全体の vitest カバレッジ 80% 以上を維持する。

---

## 補足: 将来的な改善アイデア（本計画の対象外）

- ステップごとの進捗状態をパーセンテージ等で可視化
- 各ステップに「このセクションについての説明文」を追加
- モバイル対応のためのレスポンシブステッパー（縦方向ステッパー）
