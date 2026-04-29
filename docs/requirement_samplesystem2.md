---
marp: true
theme: default
paginate: true
header: "サンプルシステム2 仕様"
style: |
  section {
    font-family: 'Hiragino Sans', 'Meiryo', sans-serif;
  }
  h1 { color: #2c5f8a; }
  h2 { color: #3a7ab5; border-bottom: 2px solid #3a7ab5; }
  table { font-size: 0.85em; }
  th { background-color: #3a7ab5; color: white; }
  tr:nth-child(even) { background-color: #f0f4f8; }
  .highlight { color: #1a6bbf; font-weight: bold; }
---

# サンプルシステム2 仕様

2023/7/3

アーキテクトサービスセンター
堀　扶

---

## 実装作業概要

### 書籍管理システムの一部機能を実装せよ

ユーザが行える操作は2つ：

- **購入済みの書籍一覧を参照する**
- **購入済み書籍の詳細を参照する**

---

## 画面遷移図

```
【一覧画面】                        【詳細画面】
  ┌─────────────────┐                ┌────────────────┐
  │  ページ選択     │                │  書籍詳細情報  │
  │  ┌───────────┐ │  書籍リンク   │                │
  │  │ 書籍一覧  │─┼──────────────▶│（別タブで表示）│
  │  └───────────┘ │                │                │
  │  ページ選択     │                │ ※他画面への   │
  └─────────────────┘                │   遷移なし     │
         ↑↓ ページ番号リンク          └────────────────┘
```

- 初期ページは **1ページ目** が表示される
- 書籍リンクを選択すると詳細画面へ（**別タブで表示**）
- 詳細画面には他画面への遷移機能はない

---

## 一覧画面

### 仕様

| 項目 | 内容 |
|------|------|
| データ表示 | DBから取り出し一覧表示 |
| 表示順 | No（ID-ブランチ番号）の昇順 |
| 1ページ件数 | **10件ずつ** |
| 1行の意味 | 購入書籍1冊（同名書籍が並ぶこともある、Noは一意） |
| ページ切替 | ページ選択リンクで変更可能 |
| 現在ページ | リンク不活性＋ページ番号背景が**灰色** |
| 書籍リンク | クリックで詳細画面へ遷移 |

サンプルファイル：[`booklist.html`](../public/booklist.html) / [`booklist.css`](../public/css/booklist.css)

---

## 詳細画面

### 仕様

| 項目 | 内容 |
|------|------|
| 表示方法 | 一覧画面とは**別タブ**で表示 |
| タブ動作 | リンクを押すたびにタブが増える |
| 表示情報 | DBから書籍の詳細情報を表示（一覧画面と同等の項目） |
| サムネイル | ISBNコードをもとに **Google Books API** を呼び出し |
| 画像あり | サムネイル画像を表示 |
| 画像なし | `NO IMAGE` 画像を代替表示 |

サンプルファイル：[`bookdetail.html`](../public/bookdetail.html) / [`bookdetail.css`](../public/css/bookdetail.css)

---

## データベース ER図

### テーブル構成（SQLite3）

**【books】書籍マスタ（241件）**

| カラム | 型 | 説明 |
|--------|----|------|
| **isbn** | TEXT | ISBNコード（インデックス） |
| title | TEXT | 書籍主題 |
| subtitle | TEXT | 書籍副題 |
| writer | TEXT | 著者 |
| print | TEXT | 出版元 |

---

## データベース ER図（続き）

**【orders】購入トランザクション（283件）**

| カラム | 型 | 説明 |
|--------|----|------|
| **id** | TEXT | 複合キー（インデックス） |
| **branch** | TEXT | 複合キー（インデックス） |
| isbn | TEXT | ISBNコード |
| recorddate | TEXT | 購入日 |
| emp_no | TEXT | 購入依頼者職番 |
| buy | TEXT | 購入元 |
| price | TEXT | 購入価格 |

**【employees】従業員マスタ（95件）**

| カラム | 型 | 説明 |
|--------|----|------|
| **emp_no** | TEXT | 購入依頼者職番（インデックス） |
| post | TEXT | 購入依頼者所属名 |
| mail | TEXT | 購入依頼者メール |
| name | TEXT | 購入依頼者氏名 |

> ※ 今回の実装では **SELECT（読み込み）のみ**使用。RDBMS の PK/FK は使用していない。

---

## 作成対象の成果物

```
プロジェクト構成
├── public/              ← 要新規作成（青色部分）
│   ├── booklist.html        【一覧画面】
│   ├── bookdetail.html      【詳細画面】
│   ├── css/
│   │   ├── booklist.css
│   │   └── bookdetail.css
│   └── image/               ← 変更不可（提供済み）
│       └── 画像群
├── app/                 ← 要新規作成（ビジネスロジック）
│   ├── 購入済み書籍一覧参照
│   └── 購入済み書籍詳細参照
└── data/                ← 変更不可
    └── booklist.sqlite3
```

- ファイル分割・追加は**自由**
- モジュール構成は**自由**

---

## 提供ファイル一覧

| フォルダ | ファイル | 説明 |
|----------|----------|------|
| public/ | booklist.html | 【一覧画面】サンプルHTML |
| public/ | bookdetail.html | 【詳細画面】サンプルHTML |
| public/css | booklist.css | 【一覧画面】サンプルCSS |
| public/css | bookdetail.css | 【詳細画面】サンプルCSS（一覧画面でもlink） |
| public/image | 20200501_noimage.png | 書籍イメージ画像がないときに表示 |
| public/image | add73.png | サンプルCSS上で使用 |
| public/image | curve12.cng | サンプルCSS上で使用 |
| public/image | stripe.png | サンプルCSS上で使用 |
| data/ | booklist.sqlite3 | SQLite3データベースファイル |
| data/ | orders.csv | ordersテーブルデータ（UTF-8, 先頭行項目名） |
| data/ | books.csv | booksテーブルデータ（UTF-8, 先頭行項目名） |
| data/ | employees.csv | employeesテーブルデータ（UTF-8, 先頭行項目名） |

---

## 実装方法について

### 技術選定

- **開発言語・ライブラリは自由**
  - サンプル実装例では `Vue.js / Node.js (Express)` を使用

### データベース

- SQLite3 を前提とするが、**別のDBMSでも可**
  - 別DBMSを使用する場合はCSVからテーブルデータを作成すること
  - データベースの作成手順も**成果物に含めること**

### 注意事項

> ⚠️ **Google Books API は1日1,000回までの上限あり**

---

## 成果物作成作業上の注意

| 項目 | 内容 |
|------|------|
| 作業時間 | 最長 **7時間30分** |
| 提出方法 | 実装成果物をZipファイル化して提出（未完成でも提出） |
| 完了時 | メールを送信（tasuku-hori@exa-corp.co.jp） |
| メール添付 | 全ソースコード・インストール/実行手順テキスト・OSSファイル |
| メール本文 | 作業時間をX.X時間形式（小数点1位まで）で記述 |
| OSS使用 | 可（社内検証のためOSS申請不要。ZipにOSSファイルを含めること） |
| 参照 | インターネット・書籍の利用は自由。**人への質問は禁止** |
| AI使用 | **Devinを使用すること** |

---

## おわり

### 参考

- [サンプルシステム２ SQLite3データベース作成手順](../docs/how_to_setup_sqlite3_for_samplesystem2.pdf)

