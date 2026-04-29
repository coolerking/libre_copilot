/**
 * SQLite3 データベース接続ラッパー
 * booklist.sqlite3 への接続管理
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/booklist.sqlite3');

// SQLite3 データベース接続
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ DB 接続エラー:', err.message);
    process.exit(1);
  } else {
    console.log('✅ SQLite3 接続成功:', DB_PATH);
    // 外部キー制約を有効化（オプション）
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) console.warn('⚠️  PRAGMA エラー:', err);
    });
  }
});

/**
 * すべての行を取得（SELECT）
 * @param {string} sql - SQL クエリ
 * @param {Array} params - クエリパラメータ
 * @returns {Promise} - 結果行の配列
 */
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ DB クエリエラー (all):', err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * 単一の行を取得（SELECT LIMIT 1）
 * @param {string} sql - SQL クエリ
 * @param {Array} params - クエリパラメータ
 * @returns {Promise} - 結果行（1件）
 */
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ DB クエリエラー (get):', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * INSERT, UPDATE, DELETE を実行
 * @param {string} sql - SQL コマンド
 * @param {Array} params - パラメータ
 * @returns {Promise} - 実行情報
 */
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('❌ DB 実行エラー (run):', err.message);
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

/**
 * トランザクション開始
 * @returns {Promise}
 */
const beginTransaction = () => {
  return run('BEGIN TRANSACTION');
};

/**
 * トランザクションコミット
 * @returns {Promise}
 */
const commit = () => {
  return run('COMMIT');
};

/**
 * トランザクションロールバック
 * @returns {Promise}
 */
const rollback = () => {
  return run('ROLLBACK');
};

/**
 * DB 接続をクローズ
 * @returns {Promise}
 */
const close = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ DB クローズエラー:', err.message);
        reject(err);
      } else {
        console.log('✅ DB クローズ完了');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  all,
  get,
  run,
  beginTransaction,
  commit,
  rollback,
  close
};
