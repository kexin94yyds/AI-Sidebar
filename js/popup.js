const PROVIDERS = {
  chatgpt: {
    label: 'ChatGPT',
    icon: 'images/providers/chatgpt.svg',
    baseUrl: 'https://chatgpt.com',
    iframeUrl: 'https://chatgpt.com/chat',
    authCheck: async () => {
      try {
        const res = await fetch('https://chatgpt.com/api/auth/session');
        if (res.status === 403) {
          return {
            state: 'cloudflare',
            message:
              'Please login and pass Cloudflare at <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a>'
          };
        }
        const data = await res.json();
        if (!res.ok || !data.accessToken) {
          return {
            state: 'unauthorized',
            message:
              'Please login at <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a> first'
          };
        }
        return { state: 'authorized' };
      } catch (e) {
        console.error('ChatGPT session check failed:', e);
        return { state: 'error', message: 'Error checking session.' };
      }
    }
  },
  codex: {
    label: 'ChatGPT Codex',
    icon: 'images/providers/codex.svg',
    baseUrl: 'https://chatgpt.com/codex',
    iframeUrl: 'https://chatgpt.com/codex',
    authCheck: async () => {
      try {
        const res = await fetch('https://chatgpt.com/api/auth/session');
        if (res.status === 403) {
          return { state: 'cloudflare', message: 'Please login and pass Cloudflare at <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a>' };
        }
        const data = await res.json();
        if (!res.ok || !data.accessToken) {
          return { state: 'unauthorized', message: 'Please login at <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a> first' };
        }
        return { state: 'authorized' };
      } catch (e) {
        console.error('ChatGPT session check failed:', e);
        return { state: 'error', message: 'Error checking session.' };
      }
    }
  },
  perplexity: {
    label: 'Perplexity',
    icon: 'images/providers/perplexity.png',
    baseUrl: 'https://www.perplexity.ai',
    iframeUrl: 'https://www.perplexity.ai/',
    authCheck: null
  },
  genspark: {
    label: 'Genspark',
    icon: 'images/providers/genspark.png',
    baseUrl: 'https://www.genspark.ai',
    iframeUrl: 'https://www.genspark.ai/agents?type=moa_chat',
    authCheck: null
  },
  tongyi: {
    label: '通义千问',
    icon: 'images/providers/tongyi.png',
    baseUrl: 'https://www.tongyi.com',
    iframeUrl: 'https://www.tongyi.com/',
    authCheck: null
  },
  doubao: {
    label: '豆包',
    icon: 'images/providers/doubao.png',
    baseUrl: 'https://www.doubao.com',
    iframeUrl: 'https://www.doubao.com/',
    authCheck: null
  },
  gemini: {
    label: 'Gemini',
    icon: 'images/providers/gemini.png',
    baseUrl: 'https://gemini.google.com',
    iframeUrl: 'https://gemini.google.com/app',
    authCheck: null // render directly; login handled by site
  },
  google: {
    label: 'Google',
    icon: 'images/providers/google.png',
    baseUrl: 'https://www.google.com',
    // User-requested AI/UDM search entry
    iframeUrl: 'https://www.google.com/search?udm=50&aep=46&source=25q2-US-SearchSites-Site-CTA',
    authCheck: null
  },
  claude: {
    label: 'Claude',
    icon: 'images/providers/claude.png',
    baseUrl: 'https://claude.ai',
    iframeUrl: 'https://claude.ai',
    authCheck: null
  },
  deepseek: {
    label: 'DeepSeek',
    icon: 'images/providers/deepseek.png',
    baseUrl: 'https://chat.deepseek.com',
    iframeUrl: 'https://chat.deepseek.com/',
    authCheck: null
  },
  grok: {
    label: 'Grok',
    icon: 'images/providers/grok.png',
    baseUrl: 'https://grok.com',
    iframeUrl: 'https://grok.com/',
    authCheck: null
  },
  notebooklm: {
    label: 'NotebookLM',
    icon: 'images/providers/notebooklm.png',
    baseUrl: 'https://notebooklm.google.com',
    iframeUrl: 'https://notebooklm.google.com/',
    authCheck: null
  },
  ima: {
    label: 'IMA',
    icon: 'images/providers/ima.jpeg', // 使用新的熊猫图标
    baseUrl: 'https://ima.qq.com',
    iframeUrl: 'https://ima.qq.com/',
    authCheck: null
  },
  attention_local: {
    label: 'Attention (Local)',
    icon: 'images/时间管道.JPG',
    baseUrl: 'vendor/attention/index.html',
    iframeUrl: 'vendor/attention/index.html',
    authCheck: null
  }
};

// Debug logging helper (set to false to silence in production)
const DEBUG = true;
const dbg = (...args) => { try { if (DEBUG) console.log('[AISidebar]', ...args); } catch (_) {} };

// Custom provider helpers (for Add AI)
async function loadCustomProviders() {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local.get(['customProviders'], (res) => {
        const arr = Array.isArray(res.customProviders) ? res.customProviders : [];
        resolve(arr);
      });
    } catch (_) { resolve([]); }
  });
}
async function saveCustomProviders(list) {
  try { chrome.storage?.local.set({ customProviders: list }); } catch (_) {}
}

// No built-in prompt overlay

// Overrides (per-provider), e.g., force useWebview true/false
const getOverrides = async () => {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local.get(['aiProviderOverrides'], (res) => {
        resolve(res.aiProviderOverrides || {});
      });
    } catch (_) { resolve({}); }
  });
};
const setOverride = async (key, patch) => {
  try {
    const all = await getOverrides();
    const cur = all[key] || {};
    all[key] = { ...cur, ...patch };
    chrome.storage?.local.set({ aiProviderOverrides: all });
  } catch (_) {}
};
// Build effective provider config with overrides, but enforce webview for Perplexity
const effectiveConfig = (baseMap, key, overrides) => {
  const base = (baseMap && baseMap[key]) || PROVIDERS[key];
  const ovr = (overrides && overrides[key]) || {};
  const merged = { ...(base || {}), ...(ovr || {}) };
  if (key === 'perplexity') merged.useWebview = false;
  return merged;
};
const clearOverride = async (key) => {
  try {
    const all = await getOverrides();
    if (all[key]) { delete all[key]; }
    chrome.storage?.local.set({ aiProviderOverrides: all });
  } catch (_) {}
};

const getProvider = async () => {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local.get(['provider'], (res) => {
        resolve(res.provider || 'chatgpt');
      });
    } catch (_) {
      resolve('chatgpt');
    }
  });
};

const setProvider = async (key) => {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local.set({ provider: key }, () => resolve());
    } catch (_) {
      resolve();
    }
  });
};

const getProviderOrder = async () => {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local.get(['providerOrder'], (res) => {
        const builtins = Object.keys(PROVIDERS);
        let order = Array.isArray(res.providerOrder) ? res.providerOrder.slice() : [];
        // append any new built-ins not in stored order
        builtins.forEach((k)=>{ if (!order.includes(k)) order.push(k); });
        resolve(order);
      });
    } catch (_) {
      resolve(Object.keys(PROVIDERS));
    }
  });
};

const saveProviderOrder = async (order) => {
  try { chrome.storage?.local.set({ providerOrder: order }); } catch (_) {}
};

// Cache embedded elements per provider to preserve state between switches
const cachedFrames = {};
// Cache simple meta for frames (e.g., expected origin)
const cachedFrameMeta = {}; // { [providerKey]: { origin: string } }
// Track the latest known URL and title inside each provider frame (from content script)
const currentUrlByProvider = {};   // { [providerKey]: string }
const currentTitleByProvider = {}; // { [providerKey]: string }

// ---- History store helpers ----
const HISTORY_KEY = 'aiLinkHistory';
// When set, renderHistoryPanel will start inline edit for this URL
let __pendingInlineEditUrl = null;
// When true, the inline edit that starts should close panel on Enter
let __pendingInlineEditCloseOnEnter = false;
// Persist history panel search across re-renders
let __historySearchQuery = '';
function deriveTitle(provider, url, rawTitle) {
  try {
    const label = historyProviderLabel(provider) || '';
    const t = (rawTitle || '').trim();
    // Filter out generic or unhelpful titles
    const blacklist = ['recent','google gemini','gemini','conversation with gemini'];
    if (t && !blacklist.includes(t.toLowerCase())) {
      if (!label) return t;
      const containsLabel = t.toLowerCase().includes(label.toLowerCase());
      // Be more permissive so titles like "ChatGPT chat" are accepted
      const extraThreshold = (provider === 'chatgpt') ? 2 : 5;
      if (!containsLabel || t.length > label.length + extraThreshold) return t;
    }
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    let id = parts[parts.length - 1] || '';
    if (provider === 'chatgpt') {
      const idx = parts.indexOf('c');
      if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1];
    } else if (provider === 'gemini') {
      const idx = parts.indexOf('app');
      if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1];
    }
    const shortId = id ? id.slice(0, 8) : '';
    return [label || provider, shortId].filter(Boolean).join(' ');
  } catch (_) { return rawTitle || historyProviderLabel(provider) || provider || 'Conversation'; }
}
async function loadHistory() {
  try {
    if (window.HistoryDB) {
      await window.HistoryDB.migrateFromStorageIfAny();
      return await window.HistoryDB.getAll();
    }
  } catch (_) {}
  // Fallback to chrome.storage.local legacy (should be gone after migration)
  try {
    const res = await new Promise((r)=> chrome.storage?.local.get([HISTORY_KEY], (v)=> r(v||{})));
    const arr = Array.isArray(res[HISTORY_KEY]) ? res[HISTORY_KEY] : [];
    return arr;
  } catch (_) { return []; }
}
async function saveHistory(list) {
  try {
    if (window.HistoryDB) {
      await window.HistoryDB.replace(Array.isArray(list) ? list : []);
      return;
    }
  } catch (_) {}
  try { await chrome.storage?.local.set({ [HISTORY_KEY]: list }); } catch (_) {}
}
async function addHistory(entry) {
  try {
    if (window.HistoryDB) {
      const suggested = typeof entry.title === 'string' ? entry.title : '';
      const title = entry && entry.needsTitle ? suggested : deriveTitle(entry.provider, entry.url, suggested);
      await window.HistoryDB.add({ ...entry, title, time: Date.now() });
      return await window.HistoryDB.getAll();
    }
  } catch (_) {}
  // Legacy fallback
  try {
    const list = await loadHistory();
    const filtered = list.filter((x)=> x && x.url !== entry.url);
    const suggested = typeof entry.title === 'string' ? entry.title : '';
    const title = entry && entry.needsTitle ? suggested : deriveTitle(entry.provider, entry.url, suggested);
    const next = [{...entry, title, time: Date.now()}].concat(filtered).slice(0, 500);
    await saveHistory(next);
    return next;
  } catch (_) { return null; }
}
function isDeepLink(providerKey, href) {
  try {
    if (!href) return false;
    const u = new URL(href);
    if (providerKey === 'chatgpt') {
      // ChatGPT deep links: /c/<id> (primary), sometimes include conversationId in query
      if (/\/c\/[a-z0-9-]+/i.test(u.pathname)) return true;
      if (u.searchParams && u.searchParams.get('conversationId')) return true;
      return false;
    }
    if (providerKey === 'gemini') return /\/app\//.test(u.pathname) && u.pathname !== '/app';
    if (providerKey === 'perplexity') return /\/search\//.test(u.pathname);
    if (providerKey === 'deepseek') return /(\/sessions\/|\/s\/|\/chat)/.test(u.pathname);
    if (providerKey === 'notebooklm') {
      // NotebookLM uses a variety of routes; treat any non-root path as a deep link
      return (u.pathname && u.pathname !== '/' && u.pathname !== '/u/0' && u.pathname !== '/u/1');
    }
    if (providerKey === 'google') {
      // Consider Google deep link when search query present
      return (u.hostname === 'www.google.com' && u.pathname === '/search' && !!u.searchParams.get('q'));
    }
  } catch (_) {}
  return false;
}
function historyProviderLabel(key) {
  const m = PROVIDERS[key];
  return (m && m.label) || key;
}
function normalizeUrlAttr(s) {
  if (!s) return s;
  // Decode common HTML entity for '&' to match stored URL
  return s.replace(/&amp;/g, '&');
}
async function renderHistoryPanel() {
  try {
    const panel = document.getElementById('historyPanel');
    if (!panel) return;
    const list = await loadHistory();
    const favList = await loadFavorites();
    const favSet = new Set((favList||[]).map(x=> x.url));
    const rows = (list || []).map((it)=>{
      const date = new Date(it.time||Date.now());
      const ds = date.toLocaleString();
      // Always show an informative title. If storage carries needsTitle with empty title,
      // fall back to a derived title so the row never appears blank.
      const titleToShow = (it && it.title && it.title.trim())
        ? it.title
        : (deriveTitle(it.provider, it.url, '') || '');
      const escTitle = titleToShow.replace(/[<>]/g,'');
      const isStarred = favSet.has(it.url);
      const starClass = isStarred ? 'hp-star active' : 'hp-star';
      const starTitle = isStarred ? 'Unstar' : 'Star';
      return `<div class="hp-item" data-url="${it.url}">
        <span class="hp-provider">${historyProviderLabel(it.provider||'')}</span>
        <span class="hp-title" data-url="${it.url}" title="${escTitle}">${escTitle}</span>
        <span class="hp-time">${ds}</span>
        <span class="hp-actions">
          <a href="${it.url}" target="_blank" rel="noreferrer">Open</a>
          <button class="hp-copy" data-url="${it.url}">Copy</button>
          <button class="hp-rename" data-url="${it.url}">Rename</button>
          <button class="${starClass}" data-url="${it.url}" title="${starTitle}">★</button>
          <button class="hp-remove" data-url="${it.url}">Remove</button>
        </span>
      </div>`;
    }).join('');
    panel.innerHTML = `<div class=\"hp-header\">\n      <span>History</span>\n      <span class=\"hp-actions\">\n        <button id=\"hp-add-current\">Add Current</button>\n        <button id=\"hp-clear-all\">Clear</button>\n        <button id=\"hp-close\">Close</button>\n      </span>\n    </div>\n    <div class=\"hp-search-row\">\n      <span class=\"hp-search-icon\">🔍</span>\n      <input id=\"hp-search-input\" class=\"hp-search-input\" type=\"text\" placeholder=\"搜索\" />\n    </div>\n    <div class=\"hp-list\">${rows || ''}</div>`;
    // events
    panel.querySelector('#hp-close')?.addEventListener('click', ()=> panel.style.display='none');
    panel.querySelector('#hp-clear-all')?.addEventListener('click', async ()=>{ await saveHistory([]); renderHistoryPanel(); });
    panel.querySelector('#hp-add-current')?.addEventListener('click', async ()=>{
      try {
        const a = document.getElementById('openInTab');
        const href = a && a.href;
        const provider = (await getProvider())||'chatgpt';
        if (href) {
          __pendingInlineEditUrl = href;
          __pendingInlineEditCloseOnEnter = true;
          const suggested = (currentTitleByProvider[provider] || document.title || '').trim();
          await addHistory({ url: href, provider, title: suggested, needsTitle: true });
          renderHistoryPanel();
        }
      } catch (_) {}
    });
    panel.querySelectorAll('.hp-copy')?.forEach((btn)=>{
      btn.addEventListener('click', async (e)=>{
        try {
          const raw = e.currentTarget.getAttribute('data-url');
          const url = normalizeUrlAttr(raw);
          await navigator.clipboard.writeText(url);
        } catch (_) {}
      });
    });
    // Delegate remove clicks to handle dynamic rerenders reliably
    try {
      if (panel._hpRemoveHandler) panel.removeEventListener('click', panel._hpRemoveHandler, true);
      panel._hpRemoveHandler = async (e) => {
        const target = e.target;
        if (!target || !(target.classList && target.classList.contains('hp-remove'))) return;
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        const raw = target.getAttribute('data-url');
        const url = normalizeUrlAttr(raw || '');
        try { if (localStorage.getItem('insidebar_debug_history')==='1') console.log('[history] remove click', url); } catch(_){}
        // Optimistic removal
        try { const row = target.closest('.hp-item'); if (row && row.parentNode) row.parentNode.removeChild(row); } catch(_){}
        try {
          if (url) {
            if (window.HistoryDB) {
              await window.HistoryDB.removeByUrl(url);
            } else {
              const list = await loadHistory();
              await saveHistory(list.filter((x)=> x.url !== url));
            }
          }
        } catch (err) { try { console.warn('remove error', err); } catch(_){} }
        renderHistoryPanel();
      };
      panel.addEventListener('click', panel._hpRemoveHandler, true);
    } catch (_) {}
    // Star/unstar from history list
    panel.querySelectorAll('.hp-star')?.forEach((btn)=>{
      btn.addEventListener('click', async (e)=>{
        const url = e.currentTarget.getAttribute('data-url');
        const isActive = e.currentTarget.classList.contains('active');
        const provider = (await getProvider())||'chatgpt';
        if (isActive) {
          const favs = await loadFavorites();
          await saveFavorites(favs.filter((x)=> x.url !== url));
          renderHistoryPanel();
        } else {
          __pendingFavInlineEditUrl = url;
          __pendingFavCloseOnEnter = true;
          const suggested = (currentTitleByProvider[provider] || document.title || '').trim();
          await addFavorite({ url, provider, title: suggested, needsTitle: true });
          try {
            if (typeof window.showFavoritesPanel === 'function') {
              await window.showFavoritesPanel();
            } else {
              const p = document.getElementById('favoritesPanel');
              if (p) p.style.display = 'block';
            }
          } catch (_) {}
          renderHistoryPanel();
        }
      });
    });
    const beginInlineEdit = (titleEl, options) => {
      try {
        const row = titleEl.closest('.hp-item');
        const url = normalizeUrlAttr(row?.getAttribute('data-url'));
        const orig = titleEl.textContent || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = orig;
        input.className = 'hp-title-input';
        titleEl.replaceWith(input);
        input.focus(); input.select();
        const closeOnEnter = !!(options && options.closeOnEnter);
        const finish = async (save, how) => {
          try {
            const newTitle = save ? (input.value || '').trim() : orig;
            const list = await loadHistory();
            const idx = list.findIndex((x)=> x.url === url);
            if (idx >= 0 && save && newTitle) {
              // Clear needsTitle once a custom title is saved
              list[idx] = { ...list[idx], title: newTitle, needsTitle: false };
              await saveHistory(list);
            }
          } catch (_) {}
          renderHistoryPanel();
          // If this inline edit was initiated by Add Current and Enter was pressed, close panel
          try {
            if (how === 'enter' && closeOnEnter) {
              if (typeof window.hideHistoryPanel === 'function') {
                window.hideHistoryPanel();
              } else {
                const p = document.getElementById('historyPanel');
                if (p) p.style.display = 'none';
                try { document.getElementById('historyBackdrop')?.remove(); } catch (_) {}
              }
            }
          } catch (_) {}
        };
        input.addEventListener('keydown', (e)=>{
          if (e.key === 'Enter') finish(true, 'enter');
          if (e.key === 'Escape') finish(false, 'escape');
        });
        input.addEventListener('blur', ()=> finish(true, 'blur'));
      } catch (_) {}
    };
    panel.querySelectorAll('.hp-title')?.forEach((el)=>{
      el.addEventListener('click', ()=> beginInlineEdit(el));
    });
    panel.querySelectorAll('.hp-rename')?.forEach((btn)=>{
      btn.addEventListener('click', (e)=>{
        const row = e.currentTarget.closest('.hp-item');
        const titleEl = row?.querySelector('.hp-title');
        if (titleEl) beginInlineEdit(titleEl);
      });
    });

    // --- Search controls (always visible below header) ---
    try {
      const searchInput = panel.querySelector('#hp-search-input');
      const filterRows = (qRaw) => {
        const q = (qRaw || '').toLowerCase();
        __historySearchQuery = qRaw || '';
        let matchCount = 0;
        panel.querySelectorAll('.hp-item')?.forEach((row)=>{
          const title = (row.querySelector('.hp-title')?.textContent || '').toLowerCase();
          const url = (row.getAttribute('data-url') || '').toLowerCase();
          const provider = (row.querySelector('.hp-provider')?.textContent || '').toLowerCase();
          const ok = !q || title.includes(q) || url.includes(q) || provider.includes(q);
          row.style.display = ok ? 'flex' : 'none';
          if (ok) matchCount++;
        });
        const emptyId = 'hp-search-empty';
        let empty = panel.querySelector('#'+emptyId);
        if (matchCount === 0 && (panel.querySelectorAll('.hp-item').length > 0)) {
          if (!empty) {
            empty = document.createElement('div');
            empty.id = emptyId;
            empty.style.padding = '8px 12px';
            empty.style.color = '#64748b';
            empty.textContent = 'No matches';
            panel.querySelector('.hp-list')?.appendChild(empty);
          }
        } else if (empty && matchCount > 0) {
          empty.remove();
        }
      };
      if (searchInput) {
        searchInput.value = __historySearchQuery;
        let __searchDebounce = null;
        searchInput.addEventListener('input', (e)=>{
          const v = e.currentTarget.value;
          if (__searchDebounce) clearTimeout(__searchDebounce);
          __searchDebounce = setTimeout(()=> filterRows(v), 80);
        });
        // If we are about to start an inline rename (after clicking Add Current),
        // do NOT steal focus to the search box. Keep focus on the rename input.
        if (!__pendingInlineEditUrl) {
          setTimeout(()=>{ try { searchInput.focus(); searchInput.select(); } catch(_){} }, 0);
        }
        filterRows(__historySearchQuery);
      }
    } catch (_) {}

    // If we have a pending inline edit request (from toolbar Add), start it now
    if (__pendingInlineEditUrl) {
      try {
        const row = panel.querySelector(`.hp-item[data-url="${CSS.escape(__pendingInlineEditUrl)}"]`);
        const titleEl = row?.querySelector('.hp-title');
        if (titleEl) beginInlineEdit(titleEl, { closeOnEnter: !!__pendingInlineEditCloseOnEnter });
      } catch (_) { /* no-op */ }
      __pendingInlineEditUrl = null;
      __pendingInlineEditCloseOnEnter = false;
    }
  } catch (_) {}
}

// ---- Favorites store helpers ----
const FAVORITES_KEY = 'aiFavoriteLinks';
let __pendingFavInlineEditUrl = null;
let __pendingFavCloseOnEnter = false;
let __favSearchQuery = '';
async function loadFavorites() {
  try {
    const res = await new Promise((r)=> chrome.storage?.local.get([FAVORITES_KEY], (v)=> r(v||{})));
    const arr = Array.isArray(res[FAVORITES_KEY]) ? res[FAVORITES_KEY] : [];
    return arr;
  } catch (_) { return []; }
}
async function saveFavorites(list) {
  try { await chrome.storage?.local.set({ [FAVORITES_KEY]: list }); } catch (_) {}
}
async function addFavorite(entry) {
  try {
    const list = await loadFavorites();
    const filtered = list.filter((x)=> x && x.url !== entry.url);
    const suggested = typeof entry.title === 'string' ? entry.title : '';
    const title = entry && entry.needsTitle
      ? suggested
      : deriveTitle(entry.provider, entry.url, suggested);
    const next = [{...entry, title, time: Date.now()}].concat(filtered).slice(0, 500);
    await saveFavorites(next);
    return next;
  } catch (_) { return null; }
}

async function renderFavoritesPanel() {
  try {
    const panel = document.getElementById('favoritesPanel');
    if (!panel) return;
    const list = await loadFavorites();
    const rows = (list || []).map((it)=>{
      const date = new Date(it.time||Date.now());
      const ds = date.toLocaleString();
      const titleToShow = (it && it.title && it.title.trim())
        ? it.title
        : (deriveTitle(it.provider, it.url, '') || '');
      const escTitle = titleToShow.replace(/[<>]/g,'');
      return `<div class="fp-item" data-url="${it.url}">
        <span class="fp-provider">${historyProviderLabel(it.provider||'')}</span>
        <span class="fp-title" data-url="${it.url}" title="${escTitle}">${escTitle}</span>
        <span class="fp-time">${ds}</span>
        <span class="fp-actions-row">
          <a href="${it.url}" target="_blank" rel="noreferrer">Open</a>
          <button class="fp-copy" data-url="${it.url}">Copy</button>
          <button class="fp-rename" data-url="${it.url}">Rename</button>
          <button class="fp-remove" data-url="${it.url}">Remove</button>
        </span>
      </div>`;
    }).join('');
    panel.innerHTML = `<div class=\"fp-header\">\n      <span>Favorites</span>\n      <span class=\"fp-actions\">\n        <button id=\"fp-add-current\">Add Current</button>\n        <button id=\"fp-clear-all\">Clear</button>\n        <button id=\"fp-close\">Close</button>\n      </span>\n    </div>\n    <div class=\"fp-search-row\">\n      <span class=\"fp-search-icon\">🔍</span>\n      <input id=\"fp-search-input\" class=\"fp-search-input\" type=\"text\" placeholder=\"搜索\" />\n    </div>\n    <div class=\"fp-list\">${rows || ''}</div>`;

    panel.querySelector('#fp-close')?.addEventListener('click', ()=> panel.style.display='none');
    panel.querySelector('#fp-clear-all')?.addEventListener('click', async ()=>{ await saveFavorites([]); renderFavoritesPanel(); });
    panel.querySelector('#fp-add-current')?.addEventListener('click', async ()=>{
      try {
        const a = document.getElementById('openInTab');
        const href = a && a.href;
        const provider = (await getProvider())||'chatgpt';
        if (href) {
          __pendingFavInlineEditUrl = href;
          __pendingFavCloseOnEnter = true;
          const suggested = (currentTitleByProvider[provider] || document.title || '').trim();
          await addFavorite({ url: href, provider, title: suggested, needsTitle: true });
          renderFavoritesPanel();
        }
      } catch (_) {}
    });
    panel.querySelectorAll('.fp-copy')?.forEach((btn)=>{
      btn.addEventListener('click', async (e)=>{
        try { await navigator.clipboard.writeText(e.currentTarget.getAttribute('data-url')); } catch (_) {}
      });
    });
    panel.querySelectorAll('.fp-remove')?.forEach((btn)=>{
      btn.addEventListener('click', async (e)=>{
        const url = e.currentTarget.getAttribute('data-url');
        const list = await loadFavorites();
        await saveFavorites(list.filter((x)=> x.url !== url));
        renderFavoritesPanel();
      });
    });
    const beginInlineEdit = (titleEl, options) => {
      try {
        const row = titleEl.closest('.fp-item');
        const url = row?.getAttribute('data-url');
        const orig = titleEl.textContent || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = orig;
        input.className = 'fp-title-input';
        titleEl.replaceWith(input);
        input.focus(); input.select();
        const closeOnEnter = !!(options && options.closeOnEnter);
        const finish = async (save, how) => {
          try {
            const newTitle = save ? (input.value || '').trim() : orig;
            const list = await loadFavorites();
            const idx = list.findIndex((x)=> x.url === url);
            if (idx >= 0 && save && newTitle) {
              list[idx] = { ...list[idx], title: newTitle };
              await saveFavorites(list);
            }
          } catch (_) {}
          renderFavoritesPanel();
          try {
            if (how === 'enter' && closeOnEnter) {
              const p = document.getElementById('favoritesPanel');
              if (p) p.style.display = 'none';
              try { document.getElementById('favoritesBackdrop')?.remove(); } catch (_) {}
            }
          } catch (_) {}
        };
        input.addEventListener('keydown', (e)=>{
          if (e.key === 'Enter') finish(true, 'enter');
          if (e.key === 'Escape') finish(false, 'escape');
        });
        input.addEventListener('blur', ()=> finish(true, 'blur'));
      } catch (_) {}
    };
    panel.querySelectorAll('.fp-title')?.forEach((el)=>{
      el.addEventListener('click', ()=> beginInlineEdit(el));
    });
    panel.querySelectorAll('.fp-rename')?.forEach((btn)=>{
      btn.addEventListener('click', (e)=>{
        const row = e.currentTarget.closest('.fp-item');
        const titleEl = row?.querySelector('.fp-title');
        if (titleEl) beginInlineEdit(titleEl);
      });
    });

    // Search
    try {
      const searchInput = panel.querySelector('#fp-search-input');
      const filterRows = (qRaw) => {
        const q = (qRaw || '').toLowerCase();
        __favSearchQuery = qRaw || '';
        let matchCount = 0;
        panel.querySelectorAll('.fp-item')?.forEach((row)=>{
          const title = (row.querySelector('.fp-title')?.textContent || '').toLowerCase();
          const url = (row.getAttribute('data-url') || '').toLowerCase();
          const provider = (row.querySelector('.fp-provider')?.textContent || '').toLowerCase();
          const ok = !q || title.includes(q) || url.includes(q) || provider.includes(q);
          row.style.display = ok ? 'flex' : 'none';
          if (ok) matchCount++;
        });
        const emptyId = 'fp-search-empty';
        let empty = panel.querySelector('#'+emptyId);
        if (matchCount === 0 && (panel.querySelectorAll('.fp-item').length > 0)) {
          if (!empty) {
            empty = document.createElement('div');
            empty.id = emptyId;
            empty.style.padding = '8px 12px';
            empty.style.color = '#64748b';
            empty.textContent = 'No matches';
            panel.querySelector('.fp-list')?.appendChild(empty);
          }
        } else if (empty && matchCount > 0) {
          empty.remove();
        }
      };
      if (searchInput) {
        searchInput.value = __favSearchQuery;
        let __searchDebounce = null;
        searchInput.addEventListener('input', (e)=>{
          const v = e.currentTarget.value;
          if (__searchDebounce) clearTimeout(__searchDebounce);
          __searchDebounce = setTimeout(()=> filterRows(v), 80);
        });
        if (!__pendingFavInlineEditUrl) {
          setTimeout(()=>{ try { searchInput.focus(); searchInput.select(); } catch(_){} }, 0);
        }
        filterRows(__favSearchQuery);
      }
    } catch (_) {}

    if (__pendingFavInlineEditUrl) {
      try {
        const row = panel.querySelector(`.fp-item[data-url="${CSS.escape(__pendingFavInlineEditUrl)}"]`);
        const titleEl = row?.querySelector('.fp-title');
        if (titleEl) beginInlineEdit(titleEl, { closeOnEnter: !!__pendingFavCloseOnEnter });
      } catch (_) {}
      __pendingFavInlineEditUrl = null;
      __pendingFavCloseOnEnter = false;
    }
  } catch (_) {}
}

const showOnlyFrame = (container, key) => {
  const nodes = container.querySelectorAll('[data-provider]');
  nodes.forEach((el) => {
    el.style.display = el.dataset.provider === key ? 'block' : 'none';
  });
};


const ensureFrame = (container, key, provider) => {
  if (!cachedFrames[key]) {
    const useWebview = !!provider.useWebview;
    const tag = useWebview ? 'webview' : 'iframe';
    const view = document.createElement(tag);
    view.setAttribute('data-provider', key);
    view.id = 'ai-frame-' + key;
    view.tabIndex = 0;
    if (tag === 'iframe') {
      view.scrolling = 'auto';
      view.frameBorder = '0';
      // Allow typical login flows (popups, redirects, storage access)
      view.allow = [
        'fullscreen',
        'clipboard-read',
        'clipboard-write',
        'geolocation',
        'camera',
        'microphone',
        'display-capture'
      ].join('; ');
    } else {
      // webview specific attributes
      // persist partition so login state survives reloads
      view.setAttribute('partition', 'persist:ai-panel');
      view.setAttribute('allowpopups', '');
      // Minimal newwindow handling: open in a normal tab (more stable across Chrome versions)
      view.addEventListener('newwindow', (e) => {
        try {
          const url = e.targetUrl || provider.baseUrl;
          window.open(url, '_blank');
          if (e.preventDefault) e.preventDefault();
        } catch (_) {}
      });
      // If a site still blocks embedding, surface a friendly message
      view.addEventListener('loadabort', (e) => {
        try {
          const reason = e.reason || 'blocked';
          const msg = 'This site refused to load in the panel (' + reason + '). ' +
                      'Click Open in Tab to use it directly.';
          const container = document.getElementById('iframe');
          renderMessage(container, msg);
        } catch (_) {}
      });
    }
    view.src = provider.iframeUrl;
    view.style.width = '100%';
    view.style.height = '100%';
    container.appendChild(view);
    cachedFrames[key] = view;
    // Update Open in Tab immediately to at least the initial URL
    try {
      const openInTab = document.getElementById('openInTab');
      if (openInTab && typeof view.src === 'string') {
        openInTab.href = view.src;
      }
    } catch (_) {}
    // Record expected origin for this provider (for message validation)
    try {
      const origin = new URL(provider.baseUrl || provider.iframeUrl).origin;
      cachedFrameMeta[key] = { origin };
      // Initialize with initial URL as a fallback until content script reports
      currentUrlByProvider[key] = provider.iframeUrl || provider.baseUrl || '';
    } catch (_) {
      cachedFrameMeta[key] = { origin: '' };
    }
    const focusHandler = () => { try { view.focus(); } catch(_) {} };
    if (tag === 'iframe') {
      view.addEventListener('load', focusHandler);
    } else {
      view.addEventListener('contentload', focusHandler);
    }
  }
  // hide message overlay if any
  const msg = document.getElementById('provider-msg');
  if (msg) msg.style.display = 'none';
  showOnlyFrame(container, key);
  try { cachedFrames[key].focus(); } catch(_) {}
};

const renderMessage = (container, message) => {
  let msg = document.getElementById('provider-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'provider-msg';
    msg.className = 'extension-body';
    container.appendChild(msg);
  }
  msg.innerHTML = '<div class="notice"><div>' + message + '</div></div>';
  msg.style.display = 'flex';
  // hide all frames but keep them mounted
  const nodes = container.querySelectorAll('[data-provider]');
  nodes.forEach((el) => { el.style.display = 'none'; });
};

// 当前拖拽中的 provider key
let __dragKey = null;

const getTabsCollapsed = async () => {
  try {
    const { tabsCollapsed } = await chrome.storage?.local.get(['tabsCollapsed']);
    return !!tabsCollapsed;
  } catch (_) {
    return false;
  }
};
const setTabsCollapsed = async (v) => {
  try { await chrome.storage?.local.set({ tabsCollapsed: !!v }); } catch (_) {}
};

// 渲染底部导航栏（左侧垂直栏）
const renderProviderTabs = async (currentProviderKey) => {
  const tabsContainer = document.getElementById('provider-tabs');
  if (!tabsContainer) return;

  const overrides = await getOverrides();
  tabsContainer.innerHTML = '';

  // 折叠状态与头部
  const collapsed = await getTabsCollapsed();
  tabsContainer.classList.toggle('collapsed', collapsed);
  const header = document.createElement('div');
  header.className = 'tabs-header';
  const toggle = document.createElement('button');
  toggle.className = 'tabs-toggle';
  toggle.title = collapsed ? '展开' : '收起';
  toggle.textContent = collapsed ? '›' : '≡';
  toggle.addEventListener('click', async (e) => {
    e.stopPropagation();
    const nv = !tabsContainer.classList.contains('collapsed');
    tabsContainer.classList.toggle('collapsed', nv);
    await setTabsCollapsed(nv);
    // 不需要重建按钮，但为保持一致刷新头部图标
    renderProviderTabs(currentProviderKey);
  });
  header.appendChild(toggle);
  tabsContainer.appendChild(header);

  // 获取所有提供商的顺序
  let providerOrder = await chrome.storage.local.get('providerOrder').then(r => r.providerOrder || Object.keys(PROVIDERS));
  
  // 确保所有内置提供商都在顺序中
  const allProviderKeys = Object.keys(PROVIDERS);
  allProviderKeys.forEach(key => {
    if (!providerOrder.includes(key)) {
      providerOrder.push(key);
    }
  });
  
  // 加载自定义提供商
  const customProviders = await loadCustomProviders();
  const ALL = { ...PROVIDERS };
  customProviders.forEach((c) => { 
    ALL[c.key] = c; 
    if (!providerOrder.includes(c.key)) providerOrder.push(c.key); 
  });

  // --- DnD 辅助函数 ---
  const clearInsertClasses = () => {
    tabsContainer.querySelectorAll('button.insert-before, button.insert-after')
      .forEach((b)=>{ b.classList.remove('insert-before','insert-after'); });
  };
  const moveKeyToIndex = async (arr, key, idx) => {
    const cur = arr.slice();
    const from = cur.indexOf(key);
    if (from === -1) return arr;
    cur.splice(from, 1);
    if (idx < 0) idx = 0;
    if (idx > cur.length) idx = cur.length;
    cur.splice(idx, 0, key);
    await saveProviderOrder(cur);
    // 重新渲染，保持当前激活不变
    renderProviderTabs(currentProviderKey);
    return cur;
  };

  // 为每个提供商创建标签按钮
  providerOrder.forEach((key) => {
    const cfg = ALL[key] || PROVIDERS[key];
    if (!cfg) return;

    const button = document.createElement('button');
    button.dataset.providerId = key;
    button.title = cfg.label; // 悬停提示
    button.className = key === currentProviderKey ? 'active' : '';
    button.draggable = !collapsed;

    // 添加图标
    if (cfg.icon) {
      const icon = document.createElement('img');
      icon.src = cfg.icon;
      icon.alt = cfg.label;
      icon.className = 'provider-icon';
      icon.onerror = function() {
        const fallback = document.createElement('div');
        fallback.className = 'provider-icon provider-icon-fallback';
        fallback.textContent = cfg.label.charAt(0).toUpperCase();
        fallback.title = cfg.label;
        this.parentNode.replaceChild(fallback, this);
      };
      button.appendChild(icon);
    } else {
      // 如果没有图标，显示首字母
      const fallback = document.createElement('div');
      fallback.className = 'provider-icon provider-icon-fallback';
      fallback.textContent = cfg.label.charAt(0).toUpperCase();
      fallback.title = cfg.label;
      button.appendChild(fallback);
    }

    // 点击切换提供商
    button.addEventListener('click', async () => {
      const container = document.getElementById('iframe');
      const openInTab = document.getElementById('openInTab');
      
      await setProvider(key);
      const p = effectiveConfig(ALL, key, overrides);
      if (openInTab) {
        const preferred = (currentUrlByProvider && currentUrlByProvider[key]) || p.baseUrl;
        openInTab.href = preferred;
        try { openInTab.title = preferred; } catch (_) {}
      }
      // ensure DNR + host permissions for selected origin
      try { (typeof ensureAccessFor === 'function') && ensureAccessFor(p.baseUrl); } catch(_) {}

      if (p.authCheck) {
        const auth = await p.authCheck();
        if (auth.state === 'authorized') {
          ensureFrame(container, key, p);
        } else {
          renderMessage(container, auth.message || 'Please login.');
        }
      } else {
        ensureFrame(container, key, p);
      }

      // 更新活动状态
      renderProviderTabs(key);
    });

    tabsContainer.appendChild(button);

    // --- 拖拽事件 ---
    button.addEventListener('dragstart', (e) => {
      if (collapsed) return; // 折叠时不启用拖拽
      __dragKey = key;
      button.classList.add('dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', key);
      } catch (_) {}
    });
    button.addEventListener('dragend', () => {
      __dragKey = null;
      button.classList.remove('dragging');
      clearInsertClasses();
    });
    button.addEventListener('dragover', (e) => {
      if (collapsed) return;
      if (!__dragKey || __dragKey === key) return;
      e.preventDefault();
      const rect = button.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      button.classList.toggle('insert-before', before);
      button.classList.toggle('insert-after', !before);
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
    });
    button.addEventListener('dragleave', () => {
      button.classList.remove('insert-before','insert-after');
    });
    button.addEventListener('drop', async (e) => {
      if (collapsed) return;
      if (!__dragKey || __dragKey === key) return;
      e.preventDefault();
      const rect = button.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      const fromIdx = providerOrder.indexOf(__dragKey);
      const toIdxBase = providerOrder.indexOf(key);
      if (fromIdx === -1 || toIdxBase === -1) return;
      let insertIdx = before ? toIdxBase : toIdxBase + 1;
      // 调整因移除后的索引偏移
      if (fromIdx < insertIdx) insertIdx -= 1;
      await moveKeyToIndex(providerOrder, __dragKey, insertIdx);
      __dragKey = null;
    });
  });

  // 展开时：使用 sticky 置顶（CSS 负责），不覆盖第一个图标
};

const initializeBar = async () => {
  const container = document.getElementById('iframe');
  const openInTab = document.getElementById('openInTab');

  const currentProviderKey = await getProvider();
  const overrides = await getOverrides();
  const mergedCurrent = effectiveConfig(PROVIDERS, currentProviderKey, overrides) || (PROVIDERS[currentProviderKey] || PROVIDERS.chatgpt);

  // 渲染底部导航栏
  await renderProviderTabs(currentProviderKey);

  // helper: request host permission for a provider URL and add DNR rule
  const ensureAccessFor = (url) => {
    let origin = null;
    try { origin = new URL(url).origin; } catch (_) {}
    if (!origin) return;
    try {
      if (chrome.permissions && chrome.permissions.request) {
        chrome.permissions.request({ origins: [origin + '/*'] }, () => {
          try { chrome.runtime.sendMessage({ type: 'ai-add-host', origin }); } catch (_) {}
        });
      } else {
        try { chrome.runtime.sendMessage({ type: 'ai-add-host', origin }); } catch (_) {}
      }
    } catch (_) {}
  };

  // The rest of this function is now handled by renderProviderTabs
  // No need to build a separate list of providers here.

  if (openInTab) {
    const preferred = currentUrlByProvider[currentProviderKey] || mergedCurrent.baseUrl;
    openInTab.href = preferred;
    try { openInTab.title = preferred; } catch (_) {}
    try { const b=document.getElementById('copyLink'); if (b) b.title = preferred; } catch (_) {}

    // Open the current provider URL in the active (left) tab
    // Falls back to a new tab if tab update isn’t possible
    openInTab.addEventListener('click', async (e) => {
      try {
        e.preventDefault();
      } catch (_) {}
      const url = openInTab.href || preferred || mergedCurrent.baseUrl;
      try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const activeTab = tabs && tabs[0];
        if (activeTab && activeTab.id) {
          await chrome.tabs.update(activeTab.id, { url });
          return;
        }
      } catch (_) {}
      try { window.open(url, '_blank'); } catch (_) {}
    });
  }

  // Copy current link button handler
  try {
    const copyBtn = document.getElementById('copyLink');
    if (copyBtn) {
      const computeUrl = () => {
        try { const a = document.getElementById('openInTab'); if (a && a.href) return a.href; } catch (_) {}
        return mergedCurrent.baseUrl;
      };
      copyBtn.addEventListener('click', async () => {
        const text = computeUrl();
        try {
          await navigator.clipboard.writeText(text);
          const old = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(() => { try { copyBtn.textContent = old; } catch (_) {} }, 1200);
        } catch (e) {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            const old = copyBtn.textContent;
            copyBtn.textContent = 'Copied';
            setTimeout(() => { try { copyBtn.textContent = old; } catch (_) {} }, 1200);
          } catch (_) {}
        }
      });
    }
  } catch (_) {}

  // History button handler
  try {
    const hBtn = document.getElementById('historyBtn');
    const panel = document.getElementById('historyPanel');
    const ensureBackdrop = () => {
      let bd = document.getElementById('historyBackdrop');
      if (!bd) {
        bd = document.createElement('div');
        bd.id = 'historyBackdrop';
        bd.className = 'history-backdrop';
        bd.addEventListener('click', () => hideHistoryPanel());
        // Attach under the same stacking context as the panel to guarantee panel stays above
        const parent = panel.parentNode || document.body;
        parent.appendChild(bd);
      }
      return bd;
    };
    const removeBackdrop = () => {
      const bd = document.getElementById('historyBackdrop');
      if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
    };
    const showHistoryPanel = async () => {
      await renderHistoryPanel();
      panel.style.display = 'block';
      ensureBackdrop();
    };
    const hideHistoryPanel = () => {
      panel.style.display = 'none';
      removeBackdrop();
    };
    window.hideHistoryPanel = hideHistoryPanel; // expose for other handlers if needed
    window.showHistoryPanel = showHistoryPanel;

    if (hBtn && panel) {
      hBtn.addEventListener('click', async () => {
        if (panel.style.display === 'none' || !panel.style.display) {
          await showHistoryPanel();
        } else {
          hideHistoryPanel();
        }
      });
    }

    // Close with Escape
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') hideHistoryPanel(); }, true);
  } catch (_) {}

  // Favorites button handler
  try {
    const fBtn = document.getElementById('favoritesBtn');
    const panel = document.getElementById('favoritesPanel');
    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName||'').toLowerCase();
      return tag === 'input' || tag === 'textarea' || !!el.isContentEditable;
    };
    const starCurrentAndOpenRename = async () => {
      try {
        const a = document.getElementById('openInTab');
        const href = a && a.href;
        const provider = (await getProvider())||'chatgpt';
        if (href) {
          __pendingFavInlineEditUrl = href;
          __pendingFavCloseOnEnter = true;
          const suggested = (currentTitleByProvider[provider] || document.title || '').trim();
          await addFavorite({ url: href, provider, title: suggested, needsTitle: true });
          return true;
        }
      } catch (_) {}
      return false;
    };
    const ensureBackdrop = () => {
      let bd = document.getElementById('favoritesBackdrop');
      if (!bd) {
        bd = document.createElement('div');
        bd.id = 'favoritesBackdrop';
        bd.className = 'favorites-backdrop';
        bd.addEventListener('click', () => hideFavoritesPanel());
        const parent = panel.parentNode || document.body;
        parent.appendChild(bd);
      }
      return bd;
    };
    const removeBackdrop = () => {
      const bd = document.getElementById('favoritesBackdrop');
      if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
    };
    const showFavoritesPanel = async () => {
      await renderFavoritesPanel();
      panel.style.display = 'block';
      ensureBackdrop();
    };
    const hideFavoritesPanel = () => {
      panel.style.display = 'none';
      removeBackdrop();
    };
    window.hideFavoritesPanel = hideFavoritesPanel;
    window.showFavoritesPanel = showFavoritesPanel;

    if (fBtn && panel) {
      fBtn.addEventListener('click', async () => {
        await starCurrentAndOpenRename();
        if (panel.style.display === 'none' || !panel.style.display) {
          await showFavoritesPanel();
        } else {
          hideFavoritesPanel();
        }
      });
    }

    // Close with Escape
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') hideFavoritesPanel(); }, true);
  } catch (_) {}

  // Add Current button in toolbar
  try {
    const addBtn = document.getElementById('addCurrentBtn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        try {
          const a = document.getElementById('openInTab');
          const href = a && a.href;
          const provider = (await getProvider())||'chatgpt';
          if (href) {
            // Add with suggested title captured from provider content script, but still open inline rename
            __pendingInlineEditUrl = href;
            __pendingInlineEditCloseOnEnter = true;
            const suggested = (currentTitleByProvider[provider] || document.title || '').trim();
            await addHistory({ url: href, provider, title: suggested, needsTitle: true });
            try {
              const panel = document.getElementById('historyPanel');
              if (panel) {
                if (typeof window.showHistoryPanel === 'function') {
                  await window.showHistoryPanel();
                } else {
                  panel.style.display = 'block';
                }
              }
            } catch (_) {}
          }
        } catch (_) {}
      });
    }
  } catch (_) {}
  try { (typeof ensureAccessFor === 'function') && ensureAccessFor(mergedCurrent.baseUrl); } catch(_) {}

  // Initial render
  if (mergedCurrent.authCheck) {
    const auth = await mergedCurrent.authCheck();
    if (auth.state === 'authorized') {
      ensureFrame(container, currentProviderKey, mergedCurrent);
    } else {
      renderMessage(container, auth.message || 'Please login.');
    }
  } else {
    ensureFrame(container, currentProviderKey, mergedCurrent);
  }

  // removed keyboard command & navigation for menu
  // (keyboard command & navigation removed)
};

// Also close panel on Escape (backdrop version handles outside clicks)
try {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    try { const p = document.getElementById('historyPanel'); if (p) p.style.display = 'none'; } catch (_) {}
    try { document.getElementById('historyBackdrop')?.remove(); } catch (_) {}
  }, true);
} catch (_) {}

  // Listen for URL updates from content scripts inside provider iframes
  window.addEventListener('message', (event) => {
    try {
      const data = event.data || {};
      if (!data || data.type !== 'ai-url-changed') return;

    // Find which provider frame this message came from by comparing contentWindow
    let matchedKey = null;
    for (const [key, el] of Object.entries(cachedFrames)) {
      try {
        if (el && el.contentWindow === event.source) {
          matchedKey = key;
          break;
        }
      } catch (_) {}
    }
    // No provider matched; ignore stray messages
    if (!matchedKey) { return; }

    // Update current URL for this provider
    if (typeof data.href === 'string' && data.href) {
      // Ignore Gemini internal utility frames to avoid polluting state
      try {
        const u = new URL(data.href);
        if (u.hostname === 'gemini.google.com' && (u.pathname === '/_/' || u.pathname.startsWith('/_/'))) {
          return;
        }
      } catch (_) {}
      currentUrlByProvider[matchedKey] = data.href;

      // If this provider is currently visible, update the Open in Tab link
      const openInTab = document.getElementById('openInTab');
      const visible = (cachedFrames[matchedKey] && cachedFrames[matchedKey].style.display !== 'none');
      if (openInTab && visible) {
        openInTab.href = data.href;
        try { openInTab.title = data.href; } catch (_) {}
        try { const b=document.getElementById('copyLink'); if (b) b.title = data.href; } catch (_) {}
      }

      // Auto-save history for supported providers when a deep link is detected
      try {
        if (isDeepLink(matchedKey, data.href)) {
          addHistory({ url: data.href, provider: matchedKey, title: data.title || '' });
        }
      } catch (_) {}
      // Track last known title for this provider for better Add Current defaults
      try { currentTitleByProvider[matchedKey] = data.title || ''; } catch (_) {}
    }
  } catch (_) {}
});

initializeBar();
