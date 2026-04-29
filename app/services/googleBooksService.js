/**
 * Google Books API 統合
 * ISBNコードからサムネイル画像を取得
 */

const axios = require('axios');

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// フォールバック画像 URL（NO IMAGE）
const NO_IMAGE_URL = '/image/20200501_noimage.png';

// API 呼び出し用のクライアント設定
const apiClient = axios.create({
  timeout: 5000, // 5秒でタイムアウト
  headers: {
    'User-Agent': 'LibreCopilot/1.0'
  }
});

/**
 * ISBN から Google Books API を通じてサムネイル URL を取得
 * @param {string} isbn - ISBNコード
 * @returns {Promise} - サムネイル URL（フォールバック画像または API URL）
 */
const getBookThumbnail = async (isbn) => {
  try {
    // 入力値チェック
    if (!isbn || typeof isbn !== 'string' || isbn.trim() === '') {
      console.warn('⚠️  無効な ISBN:', isbn);
      return NO_IMAGE_URL;
    }

    // API キーなしの場合はフォールバック
    if (!API_KEY || API_KEY === 'your_google_books_api_key_here') {
      console.warn('⚠️  Google Books API キー が設定されていません');
      return NO_IMAGE_URL;
    }

    // API リクエスト
    const response = await apiClient.get(GOOGLE_BOOKS_API_BASE, {
      params: {
        q: `isbn:${isbn}`,
        key: API_KEY,
        maxResults: 1
      }
    });

    // レスポンス検証
    if (response.data && response.data.items && response.data.items.length > 0) {
      const volumeInfo = response.data.items[0].volumeInfo;
      
      if (volumeInfo && volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
        // HTTPS に置き換え（セキュリティのため）
        return volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
      }
    }

    console.info(`ℹ️  ISBN ${isbn}: Google Books API に画像が見つかりません`);
    return NO_IMAGE_URL;
  } catch (error) {
    // エラーハンドリング（API 失敗時はフォールバック）
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️  Google Books API タイムアウト:', isbn);
    } else if (error.response && error.response.status === 403) {
      console.warn('⚠️  Google Books API - 403 Forbidden（API キーが無効）');
    } else {
      console.warn('⚠️  Google Books API エラー:', error.message);
    }
    return NO_IMAGE_URL;
  }
};

/**
 * キャッシュを使用したサムネイル取得（オプション）
 * 同じ ISBN への複数リクエストを キャッシュで高速化
 */
const thumbnailCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 時間

/**
 * キャッシュ付きで Google Books API を呼び出し
 * @param {string} isbn - ISBNコード
 * @returns {Promise} - サムネイル URL
 */
const getBookThumbnailCached = async (isbn) => {
  // キャッシュチェック
  if (thumbnailCache.has(isbn)) {
    const cached = thumbnailCache.get(isbn);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.debug(`📦 キャッシュ: ${isbn}`);
      return cached.url;
    } else {
      // キャッシュ期限切れ
      thumbnailCache.delete(isbn);
    }
  }

  // API 呼び出し
  const url = await getBookThumbnail(isbn);

  // キャッシュに保存
  thumbnailCache.set(isbn, {
    url,
    timestamp: Date.now()
  });

  return url;
};

/**
 * キャッシュをクリア
 */
const clearCache = () => {
  thumbnailCache.clear();
  console.log('📦 サムネイルキャッシュをクリア');
};

module.exports = {
  getBookThumbnail,
  getBookThumbnailCached,
  clearCache,
  NO_IMAGE_URL
};
