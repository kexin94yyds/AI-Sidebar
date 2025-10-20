// Robust URL + title reporter for provider iframes (ChatGPT, Gemini, etc.)
// Posts { type: 'ai-url-changed', href, title, origin } to the top window.

(function () {
  try {
    const dbg = (...args) => {
      try {
        if (localStorage.getItem('insidebar_debug') === '1' || localStorage.getItem('insidebar_debug_gemini') === '1') {
          console.log('[insidebar][url-sync]', ...args);
        }
      } catch (_) {}
    };

    // BFS across DOM + open shadow roots (helps with web components)
    const deepFind = (root, predicate, max = 2000) => {
      try {
        const q = [root];
        let seen = 0;
        while (q.length && seen < max) {
          const n = q.shift();
          seen++;
          if (!n) continue;
          try { if (predicate(n)) return n; } catch (_) {}
          try { if (n.shadowRoot) q.push(n.shadowRoot); } catch (_) {}
          try { if (n.children && n.children.length) q.push(...n.children); } catch (_) {}
        }
      } catch (_) {}
      return null;
    };

    // Gemini helpers
    const resolveGeminiHref = () => {
      try {
        if (location.origin !== 'https://gemini.google.com') return null;
        const anchor = deepFind(document, (el) => {
          if (!(el && el.tagName === 'A')) return false;
          const h = el.getAttribute('href') || '';
          if (!h) return false;
          const abs = h.startsWith('http') ? h : new URL(h, location.origin).href;
          return /^https:\/\/gemini\.google\.com\/app\//.test(abs) && abs !== 'https://gemini.google.com/app';
        });
        if (anchor) {
          const h = anchor.getAttribute('href');
          const abs = h && h.startsWith('http') ? h : (h ? new URL(h, location.origin).href : '');
          dbg('gemini.resolveHref.anchor', abs);
          return abs || null;
        }
        const share = deepFind(document, (n)=> n && (n.getAttribute && (n.getAttribute('data-clipboard-text') || n.getAttribute('data-share-url'))));
        if (share) {
          const v = share.getAttribute('data-clipboard-text') || share.getAttribute('data-share-url');
          if (v && /^https:\/\/gemini\.google\.com\/app\//.test(v)) return v;
        }
      } catch (_) {}
      return null;
    };
    const geminiIdFromUrl = (uStr) => {
      try {
        const u = new URL(uStr || location.href, location.origin);
        const m = u.pathname.match(/\/app\/(?:conversation\/)?([^\/?#]+)/);
        return m && m[1] ? m[1] : '';
      } catch (_) { return ''; }
    };
    const resolveGeminiTitle = () => {
      try {
        if (location.origin !== 'https://gemini.google.com') return null;
        const canonical = resolveGeminiHref() || location.href;
        const convId = geminiIdFromUrl(canonical);
        dbg('gemini.title.canonical', canonical, 'convId', convId);
        const notUseful = (t) => {
          if (!t) return true;
          const s = t.trim().toLowerCase();
          return (
            s.length === 0 ||
            s === 'recent' || s === 'gemini' || s === 'google gemini' ||
            s === 'conversation with gemini' ||
            s === 'new chat' || s === 'start a new chat' ||
            /^(新?聊天|新?对话|最近)$/.test(s)
          );
        };
        if (convId) {
          const link = deepFind(document, (el)=> el && el.tagName === 'A' && (el.getAttribute('href')||'').includes(`/app/${convId}`));
          if (link && link.textContent) {
            dbg('gemini.title.navMatch', (link.getAttribute && link.getAttribute('href')) || '', (link.textContent||'').trim());
            if (!notUseful(link.textContent)) return link.textContent.trim();
          }
        }

        // 1b) Some Gemini UIs render a non-anchor conversation title element
        // Example: <div class="conversation-title gds-label-l">学术论文修改与投稿指导</div>
        // Try within navigation first, then globally.
        const hasConvTitleClass = (el) => {
          try { return el && el.classList && Array.from(el.classList).some(c => /conversation-title/i.test(c)); } catch (_) { return false; }
        };
        // Search inside nav scope, prefer the ACTIVE item (selected/current)
        const navScope = deepFind(document, (el)=> el && (el.tagName==='NAV' || el.tagName==='ASIDE' || (el.getAttribute && el.getAttribute('role')==='navigation')));
        if (navScope) {
          const activeTitle = deepFind(navScope, (el)=> {
            if (!hasConvTitleClass(el) || !el.textContent || !el.textContent.trim()) return false;
            const container = el.closest('[aria-selected="true"], [aria-current="page"], [data-active="true"], [data-selected="true"], [class*="active"], [class*="selected"]');
            return !!container;
          });
          if (activeTitle && activeTitle.textContent) {
            const txt = activeTitle.textContent.trim();
            dbg('gemini.title.convTitleClass.nav.active', txt);
            if (!notUseful(txt)) return txt;
          }
          // Fallback: first conversation-title in nav
          const inNav = deepFind(navScope, (el)=> hasConvTitleClass(el) && el.textContent && el.textContent.trim().length > 0);
          if (inNav && inNav.textContent) {
            const txt = inNav.textContent.trim();
            dbg('gemini.title.convTitleClass.nav.first', txt);
            if (!notUseful(txt)) return txt;
          }
        }
        // Global search as a fallback
        const globalTitle = deepFind(document, (el)=> hasConvTitleClass(el) && el.textContent && el.textContent.trim().length > 0);
        if (globalTitle && globalTitle.textContent) {
          const txt = globalTitle.textContent.trim();
          dbg('gemini.title.convTitleClass.global', txt);
          if (!notUseful(txt)) return txt;
        }
        const selected = deepFind(document, (el)=> el && el.getAttribute && (el.getAttribute('aria-selected')==='true' || el.getAttribute('aria-current')==='page'));
        if (selected && selected.textContent) {
          dbg('gemini.title.selected', selected.tagName, (selected.textContent||'').trim());
          if (!notUseful(selected.textContent)) return selected.textContent.trim();
        }
        const header = deepFind(document, (el)=>{
          if (!el) return false;
          const role = el.getAttribute && el.getAttribute('role');
          const tag = (el.tagName||'').toLowerCase();
          if (tag === 'h1') return true;
          if (role === 'heading' && (el.getAttribute('aria-level')==='1' || el.getAttribute('aria-level')==='2')) return true;
          if (tag === 'h2' && el.closest && el.closest('header')) return true;
          return false;
        });
        if (header && header.textContent) {
          dbg('gemini.title.header', (header.textContent||'').trim());
          if (!notUseful(header.textContent)) return header.textContent.trim();
        }
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content) {
          dbg('gemini.title.og', og.content.trim());
          if (!notUseful(og.content)) return og.content.trim();
        }

        // 5) Heuristic: first meaningful line in the main conversation area
        const roots = Array.from(document.querySelectorAll('main, [role="main"], body'));
        const goodText = (txt) => {
          if (!txt) return false;
          const t = txt.replace(/\s+/g, ' ').trim();
          if (t.length < 8) return false;
          if (t.length > 140) return false;
          if (notUseful(t)) return false;
          // avoid obvious boilerplate
          if (/^gemini\s+for\s+/i.test(t)) return false;
          return true;
        };
        for (const r of roots) {
          try {
            const walker = document.createTreeWalker(r, NodeFilter.SHOW_ELEMENT, null);
            let count = 0;
            while (walker.nextNode() && count < 800) {
              count++;
              const el = walker.currentNode;
              if (!el) continue;
              const tag = (el.tagName||'').toLowerCase();
              // skip nav/aside/button controls
              if (['nav','aside','button','svg','img','input','textarea','select','script','style'].includes(tag)) continue;
              // Prefer likely message containers
              if (el.getAttribute && (el.getAttribute('role') === 'listitem' || el.getAttribute('role') === 'article')) {
                const t = (el.textContent||'').trim();
                if (goodText(t)) { dbg('gemini.title.firstLine.listitem', t); return t; }
              }
              if (tag === 'p' || tag === 'li') {
                const t = (el.textContent||'').trim();
                if (goodText(t)) { dbg('gemini.title.firstLine.p', t); return t; }
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
      return null;
    };

    // ChatGPT helpers
    const chatgptIdFromUrl = (uStr) => {
      try {
        const u = new URL(uStr || location.href, location.origin);
        const m = u.pathname.match(/\/c\/([\w-]+)/i);
        return m && m[1] ? m[1] : (u.searchParams.get('conversationId') || '');
      } catch (_) { return ''; }
    };
    const resolveChatGPTTitle = () => {
      try {
        if (location.origin !== 'https://chatgpt.com') return null;
        const cid = chatgptIdFromUrl(location.href);
        const notUseful = (t) => !t || /^(new\s*chat|chatgpt)$/i.test(t.trim());
        if (cid) {
          const a = document.querySelector(`a[href*="/c/${cid}"]`);
          if (a && a.textContent && !notUseful(a.textContent)) return a.textContent.trim();
        }
        const head = document.querySelector('h1,[data-testid="conversation-title"], header h2');
        if (head && head.textContent && !notUseful(head.textContent)) return head.textContent.trim();
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content && !notUseful(og.content)) return og.content.trim();
      } catch (_) {}
      return null;
    };

    // Perplexity helpers
    const resolvePerplexityHref = () => {
      try {
        if (!/\.perplexity\.ai$|^https:\/\/(www\.)?perplexity\.ai$/.test(location.hostname)) return null;
        // Prefer deep link under /search/<id>
        const a = deepFind(document, (el)=> el && el.tagName==='A' && /\/search\//.test(el.getAttribute('href')||''));
        if (a) {
          const h = a.getAttribute('href');
          return h.startsWith('http') ? h : new URL(h, location.origin).href;
        }
      } catch (_) {}
      return null;
    };
    const resolvePerplexityTitle = () => {
      try {
        if (!/\.perplexity\.ai$|^https:\/\/(www\.)?perplexity\.ai$/.test(location.hostname)) return null;
        const h1 = document.querySelector('h1,[data-testid="thread-title"],[data-qa="thread-title"]');
        if (h1 && h1.textContent && h1.textContent.trim()) return h1.textContent.trim();
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content && og.content.trim()) return og.content.trim();
      } catch (_) {}
      return null;
    };

    // DeepSeek helpers
    const resolveDeepseekHref = () => {
      try {
        if (location.hostname !== 'chat.deepseek.com') return null;
        const a = deepFind(document, (el)=> el && el.tagName==='A' && /\/(sessions|s)\//.test(el.getAttribute('href')||''));
        if (a) {
          const h = a.getAttribute('href');
          return h.startsWith('http') ? h : new URL(h, location.origin).href;
        }
      } catch (_) {}
      return null;
    };
    const resolveDeepseekTitle = () => {
      try {
        if (location.hostname !== 'chat.deepseek.com') return null;
        const notUseful = (t) => {
          if (!t) return true;
          const s = t.trim().toLowerCase();
          return s.length === 0 || s === 'deepseek' || s === 'new chat' || s === 'start new chat' || s === 'chat';
        };

        // Prefer the selected item in a left navigation if present
        const navScope = deepFind(document, (el)=> el && (el.tagName==='NAV' || el.tagName==='ASIDE' || (el.getAttribute && el.getAttribute('role')==='navigation')));
        if (navScope) {
          // (a) selected/current item text
          const sel = deepFind(navScope, (el)=> el && el.getAttribute && (el.getAttribute('aria-current')==='page' || el.getAttribute('aria-selected')==='true' || /\bactive\b|\bselected\b/.test((el.className||''))) && el.textContent && el.textContent.trim());
          if (sel && sel.textContent && !notUseful(sel.textContent)) {
            const txt = sel.textContent.trim();
            dbg('deepseek.title.nav.selected', txt);
            return txt;
          }
          // (b) anchor for current session id
          const a = deepFind(navScope, (el)=> el && el.tagName==='A' && /\/(sessions|s)\//.test(el.getAttribute('href')||'') && el.textContent && el.textContent.trim());
          if (a && a.textContent && !notUseful(a.textContent)) {
            const txt = a.textContent.trim();
            dbg('deepseek.title.nav.anchor', (a.getAttribute && a.getAttribute('href'))||'', txt);
            return txt;
          }
          // (c) any element with a likely title class
          const hasLikelyTitleClass = (el) => {
            try {
              const names = Array.from(el.classList || []).map(c => c.toLowerCase());
              const hasTitle = names.some(c => /title/.test(c));
              const hasDomain = names.some(c => /(conv|conversation|session|chat|thread)/.test(c));
              return hasTitle && hasDomain;
            } catch (_) { return false; }
          };
          const tEl = deepFind(navScope, (el)=> hasLikelyTitleClass(el) && el.textContent && el.textContent.trim());
          if (tEl && tEl.textContent && !notUseful(tEl.textContent)) {
            const txt = tEl.textContent.trim();
            dbg('deepseek.title.nav.class', txt);
            return txt;
          }
        }

        // Page header
        const h = document.querySelector('h1, header h2, [data-testid="conversation-title"]');
        if (h && h.textContent && !notUseful(h.textContent)) {
          const txt = h.textContent.trim();
          dbg('deepseek.title.header', txt);
          return txt;
        }
        // OpenGraph title
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content && !notUseful(og.content)) {
          const txt = og.content.trim();
          dbg('deepseek.title.og', txt);
          return txt;
        }
        // First meaningful line in main content as last resort
        const main = document.querySelector('main, [role="main"], body');
        if (main) {
          const good = (txt) => {
            if (!txt) return false;
            const t = txt.replace(/\s+/g,' ').trim();
            if (t.length < 4 || t.length > 140) return false; // allow shorter than Gemini for CJK
            if (notUseful(t)) return false;
            return true;
          };
          const p = deepFind(main, (el)=> {
            if (!el) return false;
            const tag = (el.tagName||'').toLowerCase();
            if (['nav','aside','button','svg','img','input','textarea','select','script','style'].includes(tag)) return false;
            return ((tag==='p' || tag==='li' || (el.getAttribute && (el.getAttribute('role')==='listitem' || el.getAttribute('role')==='article'))) && el.textContent && good(el.textContent));
          });
          if (p && p.textContent) {
            const txt = p.textContent.trim();
            dbg('deepseek.title.firstLine', txt);
            return txt;
          }
        }
      } catch (_) {}
      return null;
    };

    // NotebookLM helpers
    const resolveNotebookLMHref = () => {
      try {
        if (location.hostname !== 'notebooklm.google.com') return null;
        // Prefer links containing /project/ or /c/
        const a = deepFind(document, (el)=> el && el.tagName==='A' && /\/(project|c)\//.test(el.getAttribute('href')||''));
        if (a) {
          const h = a.getAttribute('href');
          return h.startsWith('http') ? h : new URL(h, location.origin).href;
        }
      } catch (_) {}
      return null;
    };
    const resolveNotebookLMTitle = () => {
      try {
        if (location.hostname !== 'notebooklm.google.com') return null;
        const h = document.querySelector('h1, header h2, [role="heading"][aria-level="1"], [role="heading"][aria-level="2"]');
        if (h && h.textContent && h.textContent.trim()) return h.textContent.trim();
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content && og.content.trim()) return og.content.trim();
      } catch (_) {}
      return null;
    };

    // Google Search helpers (provider 'google')
    const resolveGoogleTitle = () => {
      try {
        if (location.hostname !== 'www.google.com') return null;
        const notUseful = (t) => !t || /^google$/i.test(String(t).trim());
        // 1) Input box value (name=q)
        const qInput = document.querySelector('input[name="q"]');
        if (qInput && qInput.value && !notUseful(qInput.value)) return qInput.value.trim();
        // 2) URL param q
        const qp = new URL(location.href).searchParams.get('q');
        if (qp && !notUseful(qp)) return qp.trim();
        // 3) h1 header if present
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent && !notUseful(h1.textContent)) return h1.textContent.trim();
        // 4) og:title
        const og = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
        if (og && og.content && !notUseful(og.content)) return og.content.trim();
      } catch (_) {}
      return null;
    };

    // Sender
    let lastSent = '';
    let timer = null;
    const send = (immediate = false, reason = 'tick') => {
      const maybeGemini = resolveGeminiHref();
      const maybePplx = resolvePerplexityHref();
      const maybeDeep = resolveDeepseekHref();
      const maybeLM = resolveNotebookLMHref();
      const hrefNow = String(maybeGemini || maybePplx || maybeDeep || maybeLM || location.href);
      const title = String(
        resolveChatGPTTitle() ||
        resolveGeminiTitle() ||
        resolvePerplexityTitle() ||
        resolveDeepseekTitle() ||
        resolveNotebookLMTitle() ||
        resolveGoogleTitle() ||
        document.title || ''
      );
      const payload = { type: 'ai-url-changed', href: hrefNow, title, origin: String(location.origin) };
      const toSend = JSON.stringify(payload);
      const doPost = () => {
        try {
          if (window.top) window.top.postMessage(payload, '*');
          else if (window.parent) window.parent.postMessage(payload, '*');
          lastSent = toSend;
          dbg('post', payload, 'reason:', reason);
        } catch (_) {}
      };
      if (immediate) return doPost();
      if (toSend === lastSent) return;
      clearTimeout(timer);
      timer = setTimeout(doPost, 100);
    };

    // Initial emit
    send(true, 'init');

    // Hook History API and typical navigation events
    const wrapHistory = (method) => {
      const orig = history[method];
      if (typeof orig !== 'function') return;
      history[method] = function () {
        const ret = orig.apply(this, arguments);
        try { window.dispatchEvent(new Event('locationchange')); } catch (_) {}
        send(false, method);
        return ret;
      };
    };
    wrapHistory('pushState');
    wrapHistory('replaceState');
    window.addEventListener('popstate', () => send(false, 'popstate'));
    window.addEventListener('hashchange', () => send(false, 'hashchange'));
    window.addEventListener('locationchange', () => send(false, 'locationchange'));

    // Title mutation observer
    try {
      const titleEl = document.querySelector('title');
      if (titleEl && window.MutationObserver) {
        const mo = new MutationObserver(() => send(false, 'title-mutation'));
        mo.observe(titleEl, { subtree: true, characterData: true, childList: true });
      }
    } catch (_) {}

    // Provider-specific DOM observers
    try {
      if (window.MutationObserver && (location.origin === 'https://gemini.google.com' || location.origin === 'https://chatgpt.com' || location.origin === 'https://chat.deepseek.com')) {
        const root = document.querySelector('main,[role="main"],#app,body');
        if (root) {
          const moDom = new MutationObserver(() => send(false, 'dom-mutation'));
          moDom.observe(root, { childList: true, subtree: true, attributes: false });
        }
      }
    } catch (_) {}

    // Optional request-response interface for explicit polling
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request && request.action === 'REQUEST_TAB_INFO') {
        try {
          send(true, 'request');
          sendResponse({ title: document.title || '', url: location.href });
        } catch (_) { sendResponse({ title: document.title || '', url: location.href }); }
      }
    });
  } catch (_) {}
})();
