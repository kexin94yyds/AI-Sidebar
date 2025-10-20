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
// Track the latest known URL inside each provider frame (from content script)
const currentUrlByProvider = {}; // { [providerKey]: string }

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
  }
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
    if (!matchedKey) return;

    // We rely on event.source identity (the iframe's contentWindow).
    // Some sites and intermediate redirects can report varying origins;
    // as long as the message comes from the matched frame, accept it.

    // Update current URL for this provider
    if (typeof data.href === 'string' && data.href) {
      currentUrlByProvider[matchedKey] = data.href;

      // If this provider is currently visible, update the Open in Tab link
      const openInTab = document.getElementById('openInTab');
      const visible = (cachedFrames[matchedKey] && cachedFrames[matchedKey].style.display !== 'none');
      if (openInTab && visible) {
        openInTab.href = data.href;
        try { openInTab.title = data.href; } catch (_) {}
      }
    }
  } catch (_) {}
});

initializeBar();
