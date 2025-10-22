// Ensure base DNR rules are applied (install/remove as needed)
function applyBaseDnrRules() {
  chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
      {
        "id": 1,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://chatgpt.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 11,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.perplexity.ai/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 12,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.genspark.ai/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 15,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.tongyi.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 14,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.doubao.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 2,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://www.perplexity.ai/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 3,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://perplexity.ai/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 4,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://gemini.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 5,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://accounts.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
      ,
      {
        "id": 17,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://aistudio.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 6,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://claude.ai/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 7,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://notebooklm.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 16,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://chat.deepseek.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 8,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://ima.qq.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      },
      {
        "id": 9,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.ptlogin2.qq.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
      ,
      {
        "id": 13,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "content-security-policy-report-only", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" },
            { "header": "cross-origin-opener-policy", "operation": "remove" },
            { "header": "cross-origin-embedder-policy", "operation": "remove" },
            { "header": "cross-origin-resource-policy", "operation": "remove" },
            { "header": "permissions-policy", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://www.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
    ],
    removeRuleIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
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

 
