// Content script on netflix.com/watch/*.
// Injects the page-context controller, then relays between it and the extension.
(() => {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('netflix-page.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);

  // a small badge so you can see the sync is live
  const chip = document.createElement('div');
  chip.textContent = 'Watch Together: syncing';
  chip.style.cssText = [
    'position:fixed', 'left:16px', 'bottom:16px', 'z-index:2147483647',
    'background:rgba(20,23,29,.92)', 'color:#fff', 'font:600 12px system-ui,sans-serif',
    'padding:7px 12px', 'border-radius:999px', 'border:1px solid #2a3040',
    'pointer-events:none', 'opacity:0', 'transition:opacity .25s'
  ].join(';');
  document.documentElement.appendChild(chip);
  let hideTimer = null;
  function flash(text) {
    chip.textContent = text;
    chip.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { chip.style.opacity = '0'; }, 2200);
  }

  // player -> partner
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.source !== 'wt-netflix-page') return;
    const ev = d.ev || {};
    if (ev.a === 'ready') { flash('Watch Together: connected'); return; }
    if (ev.a === 'play')  flash('You pressed play');
    if (ev.a === 'pause') flash('You paused');
    if (ev.a === 'seek')  flash('You jumped');
    try { chrome.runtime.sendMessage({ ch: 'wt', from: 'netflix', ev }); } catch (err) {}
  });

  // partner -> player
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.ch !== 'wt' || msg.from !== 'app') return;
    const ev = msg.ev || {};
    if (ev.a === 'play')  flash('Your friend pressed play');
    if (ev.a === 'pause') flash('Your friend paused');
    if (ev.a === 'seek')  flash('Your friend jumped');
    window.postMessage({ source: 'wt-netflix-apply', ev }, '*');
  });
})();
