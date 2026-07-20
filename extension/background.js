// Relays messages between the Netflix tab and the Watch Together tab.
// Content scripts in different tabs cannot talk to each other directly.

const NETFLIX = 'https://www.netflix.com/watch/*';
const APP = 'https://watch-together-rust.vercel.app/*';

async function relay(msg, senderTabId) {
  // a message from Netflix goes to the app tab, and vice versa
  const target = msg.from === 'netflix' ? APP : NETFLIX;
  let tabs = [];
  try { tabs = await chrome.tabs.query({ url: target }); } catch (e) { return; }
  for (const t of tabs) {
    if (t.id === senderTabId) continue;
    try { await chrome.tabs.sendMessage(t.id, msg); } catch (e) { /* tab not ready */ }
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.ch !== 'wt') return;
  relay(msg, sender.tab && sender.tab.id);
});
