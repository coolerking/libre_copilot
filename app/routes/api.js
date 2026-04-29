/**
 * REST API ルーティング
 * - GET /api/books - 書籍一覧取得（ページング対応）
 * - GET /api/books/:id/:branch - 書籍詳細取得
 */

const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const googleBooksService = require('../services/googleBooksService');

/**
 * GET /api/books - 購入済み書籍一覧
 * クエリパラメータ: page (デフォルト: 1), pageSize (デフォルト: 10)
 * レスポンス: { total, page, pageSize, totalPages, hasNextPage, hasPrevPage, books }
 */
router.get('/books', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);

    console.log(`📖 GET /api/books - page=${page}, pageSize=${pageSize}`);

    const result = await bookService.getBookList(page, pageSize);

    // 各書籍にサムネイル URL を付加
    result.books = await Promise.all(
      result.books.map(async (book) => ({
        ...book,
        thumbnailUrl: await googleBooksService.getBookThumbnailCached(book.isbn)
      }))
    );

    res.json(result);
  } catch (error) {
    console.error('❌ GET /api/books エラー:', error);
    next(error);
  }
});

/**
 * GET /api/books/:id/:branch - 購入済み書籍の詳細
 * パスパラメータ: id (注文ID), branch (ブランチ番号)
 * レスポンス: { id, branch, isbn, title, ... , thumbnailUrl }
 */
router.get('/books/:id/:branch', async (req, res, next) => {
  try {
    const { id, branch } = req.params;

    console.log(`📄 GET /api/books/:id/:branch - id=${id}, branch=${branch}`);

    const book = await bookService.getBookDetail(id, branch);

    // サムネイル URL を付加
    const result = {
      ...book,
      thumbnailUrl: await googleBooksService.getBookThumbnailCached(book.isbn)
    };

    res.json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Book not found',
        statusCode: 404,
        message: `書籍が見つかりません: id=${req.params.id}, branch=${req.params.branch}`
      });
    }
    console.error('❌ GET /api/books/:id/:branch エラー:', error);
    next(error);
  }
});

/**
 * GET /api/books-count - 書籍総件数
 */
router.get('/books-count', async (req, res, next) => {
  try {
    const total = await bookService.getTotalCount();
    res.json({ total });
  } catch (error) {
    console.error('❌ GET /api/books-count エラー:', error);
    next(error);
  }
});

/**
 * POST /api/cache/clear - キャッシュクリア（管理用）
 */
router.post('/cache/clear', (req, res) => {
  try {
    googleBooksService.clearCache();
    res.json({
      status: 'ok',
      message: 'キャッシュをクリアしました'
    });
  } catch (error) {
    console.error('❌ POST /api/cache/clear エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
