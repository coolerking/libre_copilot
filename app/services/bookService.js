/**
 * 書籍ビジネスロジック
 * DB から書籍データを取得（ページング対応）
 */

const db = require('../db');

/**
 * 購入済み書籍一覧を取得（ページング対応）
 * @param {number} page - ページ番号（1から開始）
 * @param {number} pageSize - 1ページの件数（デフォルト: 10）
 * @returns {Promise} - { total, page, pageSize, books: [...] }
 */
const getBookList = async (page = 1, pageSize = 10) => {
  try {
    // ページ番号の検証
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const offset = (page - 1) * pageSize;

    // 全件数取得
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM orders`
    );
    const total = countResult.total;

    // 書籍データ取得（orders + books JOIN）
    // ソート: orders.id, orders.branch の昇順
    const books = await db.all(
      `SELECT 
        o.id,
        o.branch,
        b.isbn,
        b.title,
        b.subtitle,
        b.writer,
        b.print,
        o.recorddate,
        o.emp_no,
        o.buy,
        o.price
      FROM orders o
      JOIN books b ON o.isbn = b.isbn
      ORDER BY o.id ASC, o.branch ASC
      LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    // ページ情報を付加
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage,
      hasPrevPage,
      books: books || []
    };
  } catch (error) {
    console.error('❌ getBookList エラー:', error);
    throw error;
  }
};

/**
 * 購入済み書籍の詳細を取得
 * @param {string} id - 注文 ID
 * @param {string} branch - ブランチ番号
 * @returns {Promise} - 書籍詳細情報
 */
const getBookDetail = async (id, branch) => {
  try {
    const book = await db.get(
      `SELECT 
        o.id,
        o.branch,
        b.isbn,
        b.title,
        b.subtitle,
        b.writer,
        b.print,
        o.recorddate,
        o.emp_no,
        o.buy,
        o.price
      FROM orders o
      JOIN books b ON o.isbn = b.isbn
      WHERE o.id = ? AND o.branch = ?`,
      [id, branch]
    );

    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    return book;
  } catch (error) {
    console.error('❌ getBookDetail エラー:', error);
    throw error;
  }
};

/**
 * 書籍の総件数を取得
 * @returns {Promise} - 総件数
 */
const getTotalCount = async () => {
  try {
    const result = await db.get(`SELECT COUNT(*) as total FROM orders`);
    return result.total || 0;
  } catch (error) {
    console.error('❌ getTotalCount エラー:', error);
    throw error;
  }
};

/**
 * ISBN から書籍情報を取得
 * @param {string} isbn - ISBNコード
 * @returns {Promise} - 書籍情報
 */
const getBookByISBN = async (isbn) => {
  try {
    const book = await db.get(
      `SELECT * FROM books WHERE isbn = ?`,
      [isbn]
    );
    return book;
  } catch (error) {
    console.error('❌ getBookByISBN エラー:', error);
    throw error;
  }
};

module.exports = {
  getBookList,
  getBookDetail,
  getTotalCount,
  getBookByISBN
};
