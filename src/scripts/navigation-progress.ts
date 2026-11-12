/** Shared top progress for Astro navigation and template-library requests. */
export function installNavigationProgress(document: Document, window: Window) {
  let pending = new Set<string>();
  let reset: ReturnType<typeof setTimeout>;
  let finish: ReturnType<typeof setTimeout>;
  function paint() {
    const bar = document.getElementById('lm-navigation-progress');
    if (!bar) return;
    clearTimeout(finish);
    bar.dataset.state = pending.size ? 'loading' : 'complete';
    if (!pending.size) finish = setTimeout(() => { bar.dataset.state = 'idle'; }, 300);
  }
  function start(key: string) {
    pending.add(key); paint();
    clearTimeout(reset);
    // A failed navigation must never leave the bar stuck indefinitely.
    reset = setTimeout(() => { pending.clear(); paint(); }, 15000);
  }
  function end(key: string) { pending.delete(key); paint(); }
  document.addEventListener('click', event => {
    const e = event as MouseEvent;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as Element)?.closest?.('a');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
    start('navigation');
  });
  document.addEventListener('astro:before-preparation', () => start('navigation'));
  document.addEventListener('astro:page-load', () => end('navigation'));
  document.addEventListener('astro:after-swap', paint);
  window.addEventListener('pageshow', () => { pending.clear(); paint(); });
  window.addEventListener('pagehide', () => clearTimeout(reset));
  window.addEventListener('lm:progress-start', e => start((e as CustomEvent<string>).detail));
  window.addEventListener('lm:progress-end', e => end((e as CustomEvent<string>).detail));
}

if (typeof window !== 'undefined') installNavigationProgress(document, window);
