/**
 * 書籍管理システム - Express サーバ
 * ポート 3000 でリッスン
 * 静的ファイル配信 + REST API エンドポイント
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// REST API ルーティング
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ヘルスチェック用エンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルート URL - 一覧画面にリダイレクト
app.get('/', (req, res) => {
  res.redirect('/booklist.html');
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    statusCode: err.status || 500
  });
});

// 404 エラーハンドラ
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    statusCode: 404,
    path: req.path
  });
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   書籍管理システム - サーバ起動        ║
╚════════════════════════════════════════╝

🚀 ポート: http://localhost:${PORT}
📖 一覧画面: http://localhost:${PORT}/booklist.html
📋 API ベース: http://localhost:${PORT}/api/

ヘルスチェック: http://localhost:${PORT}/health

Ctrl+C で終了
  `);
});

module.exports = app;
