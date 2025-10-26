// 优化的DNR规则配置 - 减少冗余
const DNR_CONFIG = {
  // 通用的响应头移除配置
  commonHeaders: [
    { "header": "content-security-policy", "operation": "remove" },
    { "header": "content-security-policy-report-only", "operation": "remove" },
    { "header": "x-frame-options", "operation": "remove" },
    { "header": "cross-origin-opener-policy", "operation": "remove" },
    { "header": "cross-origin-embedder-policy", "operation": "remove" },
    { "header": "cross-origin-resource-policy", "operation": "remove" },
    { "header": "permissions-policy", "operation": "remove" }
  ],
  
  // 需要DNR规则的域名列表
  domains: [
    "https://chatgpt.com/*",
    "https://*.perplexity.ai/*", 
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
    "https://*.genspark.ai/*",
    "https://*.tongyi.com/*",
    "https://*.doubao.com/*",
    "https://gemini.google.com/*",
    "https://accounts.google.com/*",
    "https://aistudio.google.com/*",
    "https://claude.ai/*",
    "https://notebooklm.google.com/*",
    "https://chat.deepseek.com/*",
    "https://ima.qq.com/*",
    "https://*.ptlogin2.qq.com/*",
    "https://www.google.com/*"
  ]
};

// 生成DNR规则的工厂函数
function createDnrRules() {
  return DNR_CONFIG.domains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: DNR_CONFIG.commonHeaders
    },
    condition: {
      urlFilter: domain,
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }));
}

// 应用DNR规则
function applyBaseDnrRules() {
  const rules = createDnrRules();
  const ruleIds = rules.map(rule => rule.id);
  
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
    removeRuleIds: ruleIds
  });
}

chrome.runtime.onInstalled.addListener(() => {
  applyBaseDnrRules();
});

chrome.runtime.onStartup.addListener(() => {
  applyBaseDnrRules();
});

// Also apply immediately when the service worker (re)starts
applyBaseDnrRules();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))

// ---- Persist Perplexity cookies across browser restarts (best-effort) ----
const PERSIST_COOKIE_DOMAINS = [
  'perplexity.ai',
  '.perplexity.ai',
  'www.perplexity.ai'
];

async function backupPerplexityCookies() {
  try {
    const all = [];
    for (const pattern of ['https://perplexity.ai', 'https://www.perplexity.ai']) {
      const list = await chrome.cookies.getAll({ url: pattern });
      for (const c of list) {
        if (!PERSIST_COOKIE_DOMAINS.some(d => c.domain === d || c.domain.endsWith(d))) continue;
        all.push({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
          expirationDate: c.expirationDate,
          storeId: c.storeId,
          // partitionKey may exist in newer Chrome versions
          partitionKey: c.partitionKey
        });
      }
    }
    await chrome.storage.local.set({ perplexityCookieBackup: all });
  } catch (e) {
    console.warn('backupPerplexityCookies failed', e);
  }
}

async function restorePerplexityCookies() {
  try {
    const { perplexityCookieBackup } = await chrome.storage.local.get(['perplexityCookieBackup']);
    const arr = Array.isArray(perplexityCookieBackup) ? perplexityCookieBackup : [];
    for (const c of arr) {
      try {
        const urlBase = (c.domain && c.domain.includes('perplexity.ai')) ? 'https://www.perplexity.ai' : 'https://perplexity.ai';
        const details = {
          url: urlBase,
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path || '/',
          secure: !!c.secure,
          httpOnly: !!c.httpOnly,
          sameSite: c.sameSite || 'no_restriction',
          storeId: c.storeId
        };
        if (typeof c.expirationDate === 'number') details.expirationDate = c.expirationDate;
        // If partitionKey is present, pass it back (Chrome 118+)
        if (c.partitionKey) details.partitionKey = c.partitionKey;
        await chrome.cookies.set(details);
      } catch (e) {
        console.warn('restore cookie failed', c?.name, e);
      }
    }
  } catch (e) {
    console.warn('restorePerplexityCookies failed', e);
  }
}

// On startup, try to restore saved cookies so the first load has a session
chrome.runtime.onStartup.addListener(() => {
  restorePerplexityCookies();
});

// When cookies change for perplexity, back them up
chrome.cookies.onChanged.addListener((change) => {
  try {
    const c = change.cookie;
    if (!c) return;
    if (!PERSIST_COOKIE_DOMAINS.some(d => c.domain === d || c.domain.endsWith(d))) return;
    // debounce a bit
    clearTimeout(backupPerplexityCookies._t);
    backupPerplexityCookies._t = setTimeout(backupPerplexityCookies, 300);
  } catch (_) {}
});

// Handle adding DNR rules for custom hosts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg && msg.type === 'ai-add-host' && typeof msg.origin === 'string') {
        const origin = msg.origin.replace(/\/$/, '');
        const storage = await chrome.storage.local.get(['aiDnrRules']);
        const rulesMap = storage.aiDnrRules || {}; // { origin: ruleId }
        // Find existing dynamic rules to avoid duplicate IDs and duplicates by urlFilter
        const existing = await chrome.declarativeNetRequest.getDynamicRules();
        const existForOrigin = existing.find(r => r?.condition?.urlFilter === origin + '/*');
        if (existForOrigin) {
          // persist in storage for future lookups
          rulesMap[origin] = existForOrigin.id;
          await chrome.storage.local.set({ aiDnrRules: rulesMap });
          sendResponse({ ok: true, ruleId: existForOrigin.id, existed: true });
          return;
        }
        // allocate a new rule id (avoid collision with built-ins 1..999 and dynamic ones)
        const used = new Set([...Object.values(rulesMap), ...existing.map(r => r.id)]);
        let next = 1000;
        while (used.has(next)) next++;
        const rule = {
          id: next,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            responseHeaders: [
              { header: 'content-security-policy', operation: 'remove' },
              { header: 'content-security-policy-report-only', operation: 'remove' },
              { header: 'x-frame-options', operation: 'remove' },
              { header: 'cross-origin-opener-policy', operation: 'remove' },
              { header: 'cross-origin-embedder-policy', operation: 'remove' },
              { header: 'cross-origin-resource-policy', operation: 'remove' },
              { header: 'permissions-policy', operation: 'remove' }
            ]
          },
          condition: {
            urlFilter: origin + '/*',
            resourceTypes: ['main_frame', 'sub_frame']
          }
        };
        await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule], removeRuleIds: [] });
        rulesMap[origin] = next;
        await chrome.storage.local.set({ aiDnrRules: rulesMap });
        sendResponse({ ok: true, ruleId: next });
        return;
      }
      if (msg && msg.type === 'ai-remove-host' && typeof msg.origin === 'string') {
        const origin = msg.origin.replace(/\/$/, '');
        const storage = await chrome.storage.local.get(['aiDnrRules']);
        const rulesMap = storage.aiDnrRules || {};
        const id = rulesMap[origin];
        if (id) {
          await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [id] });
          delete rulesMap[origin];
          await chrome.storage.local.set({ aiDnrRules: rulesMap });
          sendResponse({ ok: true, removed: true });
          return;
        }
        sendResponse({ ok: true, removed: false });
        return;
      }
    } catch (e) {
      console.error('ai-add-host failed:', e);
      sendResponse({ ok: false, error: String(e) });
      return;
    }
    // default
    sendResponse({ ok: false });
  })();
  return true; // keep channel open for async sendResponse
});

 
