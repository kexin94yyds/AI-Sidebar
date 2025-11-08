/**
 * 自动同步模块
 * 将扩展数据自动同步到本地 sync-server
 * 
 * 使用方法:
 * 在 popup.js 或 background.js 中调用:
 * - AutoSync.syncHistory() - 同步历史记录
 * - AutoSync.syncFavorites() - 同步收藏
 * - AutoSync.syncAll() - 同步所有数据
 */

const AutoSync = (function() {
  const SYNC_SERVER_URL = 'http://localhost:3456';
  const HISTORY_KEY = 'aiLinkHistory';
  const FAVORITES_KEY = 'aiFavoriteLinks';

  let isServerAvailable = false;
  let lastCheckTime = 0;
  const CHECK_INTERVAL = 30000; // 30秒检查一次服务器状态

  /**
   * 检查同步服务器是否可用
   */
  async function checkServerAvailability() {
    const now = Date.now();
    if (now - lastCheckTime < CHECK_INTERVAL) {
      return isServerAvailable;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2秒超时
      });
      isServerAvailable = response.ok;
      lastCheckTime = now;
      return isServerAvailable;
    } catch (error) {
      isServerAvailable = false;
      lastCheckTime = now;
      return false;
    }
  }

  /**
   * 发送数据到同步服务器
   */
  async function sendToServer(endpoint, data) {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000) // 5秒超时
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      console.warn(`AutoSync: 无法连接到同步服务器 (${endpoint}):`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 同步历史记录
   */
  async function syncHistory() {
    try {
      // 检查服务器是否可用
      const available = await checkServerAvailability();
      if (!available) {
        return { success: false, reason: 'server_unavailable' };
      }

      // 获取历史数据
      let historyData = [];
      if (window.HistoryDB) {
        await window.HistoryDB.migrateFromStorageIfAny();
        historyData = await window.HistoryDB.getAll();
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        const res = await chrome.storage.local.get([HISTORY_KEY]);
        historyData = Array.isArray(res[HISTORY_KEY]) ? res[HISTORY_KEY] : [];
      }

      // 格式化数据
      const formatted = historyData.map(entry => ({
        url: String(entry.url || ''),
        provider: String(entry.provider || ''),
        title: String(entry.title || ''),
        time: Number(entry.time || Date.now())
      }));

      // 发送到服务器
      const result = await sendToServer('/sync/history', formatted);
      if (result.success) {
        console.log(`AutoSync: History 同步成功 (${formatted.length} 条)`);
      }
      return result;

    } catch (error) {
      console.error('AutoSync: History 同步失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 同步收藏
   */
  async function syncFavorites() {
    try {
      // 检查服务器是否可用
      const available = await checkServerAvailability();
      if (!available) {
        return { success: false, reason: 'server_unavailable' };
      }

      // 获取收藏数据
      let favoritesData = [];
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const res = await chrome.storage.local.get([FAVORITES_KEY]);
        favoritesData = Array.isArray(res[FAVORITES_KEY]) ? res[FAVORITES_KEY] : [];
      }

      // 格式化数据
      const formatted = favoritesData.map(entry => ({
        url: String(entry.url || ''),
        provider: String(entry.provider || ''),
        title: String(entry.title || ''),
        time: Number(entry.time || Date.now())
      }));

      // 发送到服务器
      const result = await sendToServer('/sync/favorites', formatted);
      if (result.success) {
        console.log(`AutoSync: Favorites 同步成功 (${formatted.length} 条)`);
      }
      return result;

    } catch (error) {
      console.error('AutoSync: Favorites 同步失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 同步所有数据
   */
  async function syncAll() {
    const results = await Promise.all([
      syncHistory(),
      syncFavorites()
    ]);

    return {
      history: results[0],
      favorites: results[1],
      allSuccess: results.every(r => r.success)
    };
  }

  /**
   * 启用自动同步（监听数据变化）
   */
  function enableAutoSync() {
    console.log('AutoSync: 已启用自动同步');

    // 定期同步（每分钟）
    setInterval(async () => {
      const available = await checkServerAvailability();
      if (available) {
        await syncAll();
      }
    }, 60000); // 60秒

    // 初次同步
    setTimeout(() => syncAll(), 2000);
  }

  // 公开 API
  return {
    syncHistory,
    syncFavorites,
    syncAll,
    enableAutoSync,
    checkServerAvailability
  };
})();

// 如果在浏览器环境中，暴露到全局
if (typeof window !== 'undefined') {
  window.AutoSync = AutoSync;
}

