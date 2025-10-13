const PROVIDERS = {
  chatgpt: {
    label: 'ChatGPT',
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
    baseUrl: 'https://www.perplexity.ai',
    iframeUrl: 'https://www.perplexity.ai/',
    authCheck: null // render directly; let site handle login
  },
  gemini: {
    label: 'Gemini',
    baseUrl: 'https://gemini.google.com',
    iframeUrl: 'https://gemini.google.com/app',
    authCheck: null // render directly; login handled by site
  },
  claude: {
    label: 'Claude',
    baseUrl: 'https://claude.ai',
    iframeUrl: 'https://claude.ai',
    authCheck: null
  },
  notebooklm: {
    label: 'NotebookLM',
    baseUrl: 'https://notebooklm.google.com',
    iframeUrl: 'https://notebooklm.google.com/',
    authCheck: null
  },
  ima: {
    label: 'IMA',
    baseUrl: 'https://ima.qq.com',
    iframeUrl: 'https://ima.qq.com/',
    authCheck: null
  },
  attention: {
    label: 'Attention Tracker',
    baseUrl: 'https://attention-span-tracker.netlify.app/index.html#',
    iframeUrl: 'https://attention-span-tracker.netlify.app/index.html#',
    authCheck: null
  },
  attention_local: {
    label: 'Attention (Local)',
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

// Cache iframes per provider to preserve state between switches
const cachedFrames = {};

const showOnlyFrame = (container, key) => {
  const iframes = container.querySelectorAll('iframe[data-provider]');
  iframes.forEach((el) => {
    el.style.display = el.dataset.provider === key ? 'block' : 'none';
  });
};

const ensureFrame = (container, key, provider) => {
  if (!cachedFrames[key]) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-provider', key);
    iframe.id = 'ai-frame-' + key;
    iframe.tabIndex = 0;
    iframe.scrolling = 'auto';
    iframe.src = provider.iframeUrl;
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    container.appendChild(iframe);
    cachedFrames[key] = iframe;
    iframe.addEventListener('load', () => { try { iframe.focus(); } catch(_) {} });
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
  const iframes = container.querySelectorAll('iframe[data-provider]');
  iframes.forEach((el) => { el.style.display = 'none'; });
};

const initializeBar = async () => {
  const container = document.getElementById('iframe');
  const dd = document.getElementById('providerDropdown');
  const ddToggle = document.getElementById('providerToggle');
  const ddMenu = document.getElementById('providerMenu');
  const ddLabel = document.getElementById('providerLabel');
  const openInTab = document.getElementById('openInTab');
  // removed: overlay button / prompts storage

  const currentProviderKey = await getProvider();
  const current = PROVIDERS[currentProviderKey] || PROVIDERS.chatgpt;

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

  // Build dropdown menu
  let providerOrder = await getProviderOrder();
  const customProviders = await loadCustomProviders();
  const ALL = { ...PROVIDERS };
  // merge customs
  customProviders.forEach((c) => { ALL[c.key] = c; if (!providerOrder.includes(c.key)) providerOrder.push(c.key); });

  const buildMenu = (currentKey) => {
    if (!ddMenu) return;
    ddMenu.innerHTML = '';
    // Quick action: grant access for current provider
    if (currentKey) {
      const grant = document.createElement('div');
      grant.className = 'dd-add';
      grant.textContent = 'Grant site access (current)';
      grant.onclick = (e) => {
        e.stopPropagation();
        const cur = ALL[currentKey] || PROVIDERS[currentKey];
        if (cur) ensureAccessFor(cur.baseUrl || cur.iframeUrl);
        ddMenu.style.display = 'none';
      };
      ddMenu.appendChild(grant);
    }

    // Add AI entry
    const add = document.createElement('div');
    add.className = 'dd-add';
    add.textContent = '+ Add AI';
    add.onclick = () => {
      const label = prompt('AI Name');
      if (!label) return;
      const url = prompt('AI URL (e.g. https://example.com)');
      if (!url) return;
      const key = 'custom:' + Date.now();
      const item = { key, label, baseUrl: url, iframeUrl: url, authCheck: null };
      // request host permission for the origin (must be called during user gesture)
      let origin = null;
      try { origin = new URL(url).origin; } catch (_) {}
      const proceed = () => {
        // add dynamic rule in background (best-effort)
        if (origin) {
          try { chrome.runtime.sendMessage({ type: 'ai-add-host', origin }); } catch (_) {}
        }
        // persist provider and select it
        loadCustomProviders().then((list) => {
          list.push(item);
          saveCustomProviders(list);
        });
        ALL[key] = item;
        providerOrder = [key, ...providerOrder];
        saveProviderOrder(providerOrder);
        ddMenu.style.display = 'none';
        ddLabel.textContent = label;
        setProvider(key);
        if (openInTab) openInTab.href = url;
        ensureFrame(container, key, item);
      };
      if (origin && chrome.permissions && chrome.permissions.request) {
        chrome.permissions.request({ origins: [origin + '/*'] }, (granted) => {
          // ignore runtime.lastError; still proceed (Open in Tab 作为兜底)
          proceed();
        });
      } else {
        proceed();
      }
    };
    ddMenu.appendChild(add);
    providerOrder.forEach((key) => {
      const cfg = ALL[key] || PROVIDERS[key];
      if (!cfg) return;
      const item = document.createElement('div');
      item.className = 'dd-item' + (key === currentKey ? ' active' : '');
      // left pin arrow
      const pin = document.createElement('span');
      pin.className = 'pin';
      pin.textContent = '⬆';
      pin.title = 'Move to top';
      pin.onclick = async (e) => {
        e.stopPropagation();
        providerOrder = [key, ...providerOrder.filter(k => k !== key)];
        await saveProviderOrder(providerOrder);
        buildMenu(currentKey);
      };

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = cfg.label;

      // delete custom provider
      let del = null;
      if (key.startsWith('custom:')) {
        del = document.createElement('span');
        del.className = 'del';
        del.textContent = '✕';
        del.title = 'Delete';
        del.onclick = async (e) => {
          e.stopPropagation();
          // remove from storage
          const list = await loadCustomProviders();
          const left = list.filter(p => p.key !== key);
          await saveCustomProviders(left);
          // remove dnr rule
          try {
            const origin = new URL(cfg.baseUrl).origin;
            chrome.runtime.sendMessage({ type: 'ai-remove-host', origin });
          } catch (_) {}
          // update order & ALL
          providerOrder = providerOrder.filter(k => k !== key);
          await saveProviderOrder(providerOrder);
          delete ALL[key];
          // if was selected, fallback to first provider
          if (ddLabel.textContent === cfg.label) {
            const fallbackKey = providerOrder[0] || 'chatgpt';
            const fallback = ALL[fallbackKey] || PROVIDERS[fallbackKey];
            ddLabel.textContent = fallback.label;
            await setProvider(fallbackKey);
            if (openInTab) openInTab.href = fallback.baseUrl;
            ensureFrame(container, fallbackKey, fallback);
          }
          buildMenu(currentKey);
        };
      }

      item.appendChild(pin);
      item.appendChild(label);
      if (del) item.appendChild(del);
      item.dataset.key = key;
      item.onclick = async () => {
        ddMenu.style.display = 'none';
        ddLabel.textContent = cfg.label;
        await setProvider(key);
        const p = ALL[key] || PROVIDERS[key];
        if (openInTab) openInTab.href = p.baseUrl;
        // ensure host access (optional permission) and DNR rule (user gesture)
        ensureAccessFor(p.baseUrl || p.iframeUrl);
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
        buildMenu(key);
      };
      ddMenu.appendChild(item);
    });
  };

  // Initialize dropdown
  if (ddToggle && ddMenu && ddLabel) {
    ddLabel.textContent = (PROVIDERS[currentProviderKey] || PROVIDERS.chatgpt).label;
    buildMenu(currentProviderKey);
    ddToggle.onclick = (e) => {
      e.preventDefault();
      ddMenu.style.display = ddMenu.style.display === 'none' ? 'block' : 'none';
    };
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target)) ddMenu.style.display = 'none';
    });
  }

  if (openInTab) openInTab.href = current.baseUrl;

  // Initial render
  if (current.authCheck) {
    const auth = await current.authCheck();
    if (auth.state === 'authorized') {
      ensureFrame(container, currentProviderKey, current);
    } else {
      renderMessage(container, auth.message || 'Please login.');
    }
  } else {
    ensureFrame(container, currentProviderKey, current);
  }

  // removed keyboard command & navigation for menu
  // (keyboard command & navigation removed)
};

initializeBar();
