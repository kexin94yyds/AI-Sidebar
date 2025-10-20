// Content script to report the current page URL to the parent extension page
// Runs on provider sites loaded inside the sidebar iframe.

(function () {
  try {
    // Run in the main provider frame loaded inside the sidebar iframe.
    // Do NOT early-return based on window.top/window, because inside the
    // side panel the provider is always an iframe and we still need to run.
    // Throttled sender
    let lastSent = '';
    let timer = null;

    const send = (immediate = false) => {
      const payload = {
        type: 'ai-url-changed',
        href: String(location.href),
        title: String(document.title || ''),
        origin: String(location.origin)
      };
      const toSend = JSON.stringify(payload);
      const doPost = () => {
        try {
          // Post to parent (extension side-panel document)
          window.parent && window.parent.postMessage(payload, '*');
          lastSent = toSend;
        } catch (_) {}
      };
      if (immediate) {
        doPost();
        return;
      }
      if (toSend === lastSent) return;
      clearTimeout(timer);
      timer = setTimeout(doPost, 100); // debounce rapid changes
    };

    // Initial send
    send(true);

    // Hook History API
    const wrapHistory = (method) => {
      const orig = history[method];
      if (typeof orig !== 'function') return;
      history[method] = function () {
        const ret = orig.apply(this, arguments);
        try {
          const ev = new Event('locationchange');
          window.dispatchEvent(ev);
        } catch (_) {}
        send();
        return ret;
      };
    };
    wrapHistory('pushState');
    wrapHistory('replaceState');

    // Popstate/hashchange listeners
    window.addEventListener('popstate', () => send());
    window.addEventListener('hashchange', () => send());
    window.addEventListener('locationchange', () => send());

    // Also observe title mutations to update display title
    try {
      const titleEl = document.querySelector('title');
      if (titleEl && window.MutationObserver) {
        const mo = new MutationObserver(() => send());
        mo.observe(titleEl, { subtree: true, characterData: true, childList: true });
      }
    } catch (_) {}
  } catch (_) {}
})();
