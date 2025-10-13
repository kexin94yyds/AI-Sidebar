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
            { "header": "x-frame-options", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://chatgpt.com/*",
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
            { "header": "x-frame-options", "operation": "remove" }
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
            { "header": "x-frame-options", "operation": "remove" }
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
            { "header": "x-frame-options", "operation": "remove" }
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
            { "header": "x-frame-options", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://accounts.google.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
      ,
      {
        "id": 6,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" }
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
            { "header": "x-frame-options", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://notebooklm.google.com/*",
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
            { "header": "x-frame-options", "operation": "remove" }
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
            { "header": "x-frame-options", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://*.ptlogin2.qq.com/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
      ,
      {
        "id": 10,
        "priority": 1,
        "action": {
          "type": "modifyHeaders",
          "responseHeaders": [
            { "header": "content-security-policy", "operation": "remove" },
            { "header": "x-frame-options", "operation": "remove" }
          ]
        },
        "condition": {
          "urlFilter": "https://attention-span-tracker.netlify.app/*",
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      }
    ],
    removeRuleIds: [1,2,3,4,5,6,7,8,9,10]
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
              { header: 'x-frame-options', operation: 'remove' }
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

 
