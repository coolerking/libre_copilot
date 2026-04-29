# 計画: 書籍管理システム 完全実装

**TL;DR** 
Node.js + Express + SQLite3 で、段階的に **バックエンド API** → **フロントエンド画面** → **統合・検証** の 3 フェーズで実装。動作優先で進め、Google Books API との連携でサムネイル取得機能を完成させます。

---

## **Steps（実装ステップ）**

### **Phase 1: バックエンド基盤構築** [平行実装可、依存なし]

**Step 1. プロジェクト初期化**
- `app/` ディレクトリ新規作成
- `package.json` 新規作成（依存: express, sqlite3, cors, axios）
- `.gitignore` 更新（`node_modules/`, `.env`）
- [app/server.js](app/server.js) - Express サーバ entry point 作成
  - ポート `3000` でリッスン
  - CORS ミドルウェア有効化
  - 静的ファイル配信設定（`public/`）

**Step 2. DB 接続層** [depends on Step 1]
- [app/db.js](app/db.js) - SQLite3 接続管理
  - `data/booklist.sqlite3` を開く
  - `db.all()`, `db.get()` ラッパー関数
  - エラーハンドリング

**Step 3. ビジネスロジック層** [depends on Step 2]
- [app/services/bookService.js](app/services/bookService.js)
  - `getBookList(page, pageSize=10)` - orders + books JOIN、ページングロジック
  - `getBookDetail(id, branch)` - 詳細取得
  - **SQL クエリ内容**:
    - **一覧**: `SELECT o.id, o.branch, b.isbn, b.title, b.subtitle, b.writer, b.print, o.recorddate FROM orders o JOIN books b ON o.isbn = b.isbn ORDER BY o.id, o.branch LIMIT 10 OFFSET (page-1)*10`
    - **詳細**: `SELECT o.*, b.* FROM orders o JOIN books b ON o.isbn = b.isbn WHERE o.id = ? AND o.branch = ?`
- [app/services/googleBooksService.js](app/services/googleBooksService.js)
  - `getBookThumbnail(isbn)` - Google Books API 呼び出し
  - API キーは `process.env.GOOGLE_BOOKS_API_KEY`
  - **フォールバック**: 画像取得失敗 → `NO IMAGE` 画像 URL 返却

**Step 4. REST API ルーティング** [depends on Step 3]
- [app/routes/api.js](app/routes/api.js)
  - `GET /api/books?page=1` → bookService.getBookList() 呼び出し
  - `GET /api/books/:id/:branch` → bookService.getBookDetail() 呼び出し
  - **レスポンス形式**:
    ```json
    {
      "total": 121,
      "page": 1,
      "pageSize": 10,
      "books": [
        {
          "id": "5111", "branch": "0", "isbn": "...",
          "title": "...", "subtitle": "...", "writer": "...", "print": "...",
          "recorddate": "2015/5/8",
          "thumbnailUrl": "https://books.google.com/..." 
        }
      ]
    }
    ```
  - エラー時: `{ "error": "...", "statusCode": 400|500 }`

---

### **Phase 2: フロントエンド実装** [depends on Phase 1 完了]

**Step 5. 一覧画面動的化** [depends on Step 4 API 完成]
- [public/booklist.html](public/booklist.html) 修正
  - Vue.js インスタンス初期化（既に `<script src="...vue.js"></script>` あり）
  - `data()`: currentPage, books, totalCount, pageSize
  - `mounted()`: API から `page=1` データ取得
  - ページリンク: `@click="changePage(pageNum)"` 動的バインディング
  - **ページ表示ロジック**: currentPage 時は `<a class="no-link">` + 背景灰色、他は `<a href="">`
  - 書籍タイトルリンク: `@click="openDetail(book.id, book.branch)"` で詳細画面を新タブで開く

**Step 6. 詳細画面動的化** [depends on Step 4, Step 5]
- [public/bookdetail.html](public/bookdetail.html) 修正
  - URL パラメータから `id`, `branch` 抽出（例: `?id=5111&branch=0`）
  - Vue.js で API `/api/books/:id/:branch` から詳細データ取得
  - サムネイル画像: `<img :src="book.thumbnailUrl">`
  - **画像エラーハンドリング**: `@error="book.thumbnailUrl = noImageUrl"`

---

### **Phase 3: 統合・検証** [depends on Phase 2 完了]

**Step 7. 統合テスト・エラーハンドリング**
- 一覧画面で複数ページアクセス確認（ページ 1-13）
- 一覧 → 詳細画面遷移（新タブ、別ウィンドウで開くことを確認）
- Google Books API 失敗時のフォールバック動作確認
- 存在しないページ・書籍 ID アクセス時の エラーメッセージ表示確認
- DB コネクション エラーハンドリング確認

**Step 8. デプロイ準備・ドキュメント整備**
- [.env](/.env) ファイル作成
  - `GOOGLE_BOOKS_API_KEY=your_api_key_here`
  - `PORT=3000`
  - `DB_PATH=./data/booklist.sqlite3`
- [README.md](README.md) 追記
  - 実行手順: `npm install`, `npm start`
  - Google Books API キー取得方法
  - フォルダ構成説明
  - トラブルシューティング
- `package.json` の `scripts.start` 設定

---

## **Relevant files（修正・作成対象ファイル）**

### 新規作成
- [app/server.js](app/server.js) — Express サーバ初期化
- [app/db.js](app/db.js) — SQLite3 接続ラッパー
- [app/services/bookService.js](app/services/bookService.js) — 書籍ビジネスロジック（JOIN、ページング）
- [app/services/googleBooksService.js](app/services/googleBooksService.js) — Google Books API 呼び出し
- [app/routes/api.js](app/routes/api.js) — REST API エンドポイント定義
- [package.json](package.json) — Node.js 依存パッケージ定義
- [.env](/.env) — 環境変数（Google Books API キー、ポート番号）
- [.gitignore](.gitignore) — Git 除外ファイル
- [docs/project_plan.md](docs/project_plan.md) — 本計画ドキュメント

### 修正対象
- [public/booklist.html](public/booklist.html) — Vue.js 統合、API 連携、ページング動的化
- [public/bookdetail.html](public/bookdetail.html) — Vue.js 統合、API 連携、サムネイル表示
- [README.md](README.md) — 実行手順、セットアップガイド追記

### 変更対象なし
- `public/css/booklist.css`, `public/css/bookdetail.css` — スタイルそのまま流用
- `public/image/` — 提供画像そのまま使用
- `data/booklist.sqlite3` — DB ファイルそのまま使用

---

## **Verification（検証ステップ）**

### 自動テスト（推奨）
1. **API 単体テスト**
   ```bash
   npm install --save-dev jest
   # test/api.test.js で各エンドポイント テスト
   npm test
   ```
2. **DB クエリテスト**
   - bookService.getBookList(1) が 10 件返却確認
   - bookService.getBookDetail("5111", "0") が正しいデータ返却確認

### 手動テスト
1. **サーバ起動**
   ```bash
   node app/server.js
   # or
   npm start
   ```
   - http://localhost:3000/ が booklist.html を配信確認

2. **API 動作確認**
   ```bash
   curl "http://localhost:3000/api/books?page=1"
   curl "http://localhost:3000/api/books/5111/0"
   ```
   - JSON レスポンスが正形式か確認
   - thumbnailUrl が Google Books API URL か、NO IMAGE URL か確認

3. **UI 動作確認**
   - http://localhost:3000/public/booklist.html で一覧ページ表示
   - ページ選択リンクで ページング動作確認
   - 現在ページが灰色背景 + リンク無効化
   - 書籍タイトルリンク クリック → 詳細画面が新タブで開く確認

4. **詳細画面確認**
   - http://localhost:3000/public/bookdetail.html?id=5111&branch=0 でアクセス
   - 書籍情報が表示される
   - サムネイル画像が表示される（またはフォールバック画像）

5. **エッジケース確認**
   - 存在しないページ: `/api/books?page=100` → エラーレスポンス
   - 存在しないページ: `/api/books/99999/0` → エラーレスポンス
   - Google Books API キー無効 → フォールバック画像表示

---

## **Decisions（設計判断）**

1. **技術選定**: Node.js + Express を採用
   - 理由: サンプル実装例で推奨、JavaScript 単一言語、セットアップ簡易
   
2. **フロントエンド**: Vue.js 2.x（CDN から直接読み込み）
   - 理由: サンプル HTML で既に import 済み、軽量で SPA 不要
   
3. **DB**: SQLite3 提供ファイルをそのまま使用
   - 理由: ローカル開発で十分、セットアップ不要
   
4. **サムネイル取得**: Google Books API 非同期呼び出し
   - 理由: 大量呼び出しは避け、詳細画面時のみ呼び出し
   - 1 日 1000 回制限に対応（キャッシング戦略は Phase 3 以降検討）
   
5. **ページネーション**: サーバ側で LIMIT/OFFSET 実装
   - 理由: 大規模データに対応、フロントの負担軽減
   
6. **エラーハンドリング**: 4xx/5xx HTTP ステータス + JSON エラーメッセージ
   - 理由: REST 標準、クライアント側での例外処理が明確

---

## **Further Considerations（今後の改善案）**

1. **パフォーマンス最適化** （Phase 3 以降）
   - Google Books API レスポンス キャッシング（Redis または メモリ）
   - DB クエリ インデックス確認・最適化
   - 推奨: ローカルメモリキャッシュ → Redis への段階的改善

2. **テスト・品質**
   - Jest で単体テスト、統合テスト実装
   - エラーハンドリング強化（タイムアウト、リトライ）

3. **機能拡張**（要件外）
   - 検索・フィルター機能
   - 従業員情報表示
   - 購入統計ダッシュボード

---

## **実装開始前の確認事項**

✅ Node.js v14+ インストール済み確認  
✅ Google Books API キー 取得（無料版）  
✅ `data/booklist.sqlite3` ファイル存在確認  
✅ Git リポジトリ 初期化済み確認

---

これで計画が完成しました。上記の **3 フェーズ 8 ステップ** に従って実装を進めることで、動作する書籍管理システムが完成します。質問や修正案があれば、お知らせください！
