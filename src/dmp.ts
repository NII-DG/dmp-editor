import { Pattern } from "@mui/icons-material"
import { url } from "inspector"
import { text } from "stream/consumers"

// === Type definitions ===
export interface Dmp {
  metadata: DmpMetadata // DMP 作成・更新情報
  projectInfo: ProjectInfo // プロジェクト情報
  personInfo: PersonInfo[] // 担当者情報
  dataInfo: DataInfo[] // 研究データ情報
}

// DMP 作成・更新情報
export interface DmpMetadata {
  revisionType: "新規" | "修正" | "更新" // 種別
  submissionDate: string // 提出日 YYYY-MM-DD
  dateCreated: string // DMP作成年月日 YYYY-MM-DD
  dateModified: string // DMP最終更新年月日 YYYY-MM-DD
}
// ほぼほぼ自動補完しつつ、手動でも返信できる
// date picker がついた text field

// プロジェクト情報
export interface ProjectInfo {
  fundingAgency: string // 資金配分機関情報
  programName?: string | null// プログラム名(事業名・種目名)
  programCode?: string | null // 体系的番号におけるプログラム情報コード
  projectCode: string // 体系的番号
  projectName: string // プロジェクト名

  // 体系的番号 => 15 桁
  // 体系的番号におけるプログラム情報コード その一部が
  // どこまでやるかは調べつつ (最新情報がとれるとはかぎらない、配布方法も pdf だったり、excel だったりする。すくなく api はない。)

  // 調べてみて、なるべく自動補完とか選択式でやってみる
  // 9 桁のやつを入れたら、programName が埋まるとかだとかっこいいのかな？

  adoptionYear?: string | null // 採択年度
  startYear?: string | null // 事業開始年度
  endYear?: string | null // 事業終了年度
}

// fundingAgency -> JSPS (user free form でいれることはない)

// programName -> さきがけ とか ACT-X
// https://www.nistep.go.jp/wp/wp-content/uploads/bca0d1f99f22926ac3f1dce47e4898e2.pdf
// programName と programCode を grouping した field をつける
// できる限り select とか保管できる
// 選んだらプログラムコードが入るとか

// optional
// projectCode 謝辞に書くやつ
// and projectName
// 提案ベース

// 担当者情報
export interface PersonInfo {
  role: ("研究代表者" | "研究分担者" | "管理対象データの作成者" | "管理対象データの管理責任者")[] // no header
  // internalId: number // 本計画書内通し番号
  lastName: string // 性
  firstName: string // 名
  eRadResearcherId?: string | null // e-Rad研究者番号
  orcid?: string | null // ORCID
  affiliation: string // 所属機関
  // free text
}

// "エクセルっぽく作る"
// "追加する ボタン"

// 研究データ情報
export interface DataInfo {
  dataNumber: number // データナンバー
  // 5桁の id
  // 自動採番で生成したほうが良いよね
  // この project の中で unique だったらよい
  // uuid
  // random 5 桁の prefix
  // prefix - 連番の方が良いのかな

  // 税金系の電子申請
  // 書類に対して 4桁の数字の自由な管理番号を入力してください
  // ※ 過去入力した管理番号はやめてください

  dataName: string // 管理対象データの名称
  publicationDate: string // 掲載日・掲載更新日
  description: string // データの説明
  acquisitionMethod?: string | null // 管理対象データの取得または収集方法
  // string long text with (\n)
  researchField: "ライフサイエンス" | "情報通信" | "環境" | "ナノテク・材料" | "エネルギー" | "ものづくり技術" | "社会基盤" | "フロンティア" | "人文・社会" | "自然科学一般" | "その他" // データの分野
  dataType: "データセット" | "集計データ" | "臨床試験データ" | "編集データ" | "符号化データ" | "実験データ" | "ゲノムデータ" | "地理空間データ" | "実験ノート" | "測定・評価データ" | "観測データ" | "記録データ" | "シミュレーションデータ" | "調査データ" // データ種別
  dataSize?: string | null // 概略データ量
  // range 付きの選択肢 and 単位 (1000 単位 GB)
  reuseInformation?: string | null// 再利用を可能にするための情報
  hasSensitiveData?: boolean | null // 機微情報の有無: 有 | 無
  sensitiveDataPolicy?: string | null // 機微情報がある場合の取扱い方針
  usagePolicy: string // 管理対象データの利活用・提供方針 (研究活動時)
  // repositoryInformation: string // リポジトリ情報 (研究活動時)
  // dataStorageLocation
  // backupLocation: string // 管理対象データのバックアップ場所 (研究活動時)

  publicationPolicy?: string | null // 管理対象データの公開・提供方針詳細
  accessRights: "公開" | "共有" | "非共有・非公開" | "公開期間猶予" // アクセス権
  plannedPublicationDate: string // 管理対象データの公開予定日 YYYY-MM-DD
  //
  repository: string // リポジトリ情報 (リポジトリ URL・DOIリンク) (研究活動後)
  // url はこないだろう
  // repositoryUrl: string // リポジトリ URL
  // url はこないだろう
  // doiUrl: string // DOIリンク
  dataCreator?: string | null // 管理対象データの作成者
  // dataManagementAgency: string // データ管理機関
  rorId?: string // データ管理機関コード(ROR ID)
  // ror は optional
  // dataManager: string // データ管理者（部署名等）
  // dataManagementDepartment:  // 部署名
  dataManagerContact: string // データ管理者の連絡先
  dataStorageLocation?: string | null // 研究データの保存場所（研究事業終了後）
  dataStoragePeriod?: string | null // 研究データの保存期間（研究事業終了後）
}

// リポジトリ情報
// - 3 Pattern
//   - free text
//   - free url
//   - doi
