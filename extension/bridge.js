// Content script on the Watch Together app.
// The app tab is already signed in and connected to your room, so it does the
// networking. This file just carries messages between the page and the extension.
(() => {
  // tell the page an extension is present, so it can show the Netflix sync state
  window.postMessage({ source: 'wt-ext-hello' }, '*');

  // netflix tab -> this page -> partner
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.ch !== 'wt' || msg.from !== 'netflix') return;
    window.postMessage({ source: 'wt-ext', ev: msg.ev }, '*');
  });

  // partner -> this page -> netflix tab
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.source !== 'wt-page') return;
    try { chrome.runtime.sendMessage({ ch: 'wt', from: 'app', ev: d.ev }); } catch (err) {}
  });
})();
