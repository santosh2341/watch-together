// Watch Together service worker.
// Deliberately does NOT cache the app shell: the HTML changes often and a stale
// cache would leave people on an old build. This exists so the app installs as a
// real app and so notifications survive a tap.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Tapping a notification should focus the app rather than open a second copy.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  })());
});

// Lets the page raise a notification through the service worker, which is what
// an installed app needs on Android for the notification to appear reliably.
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type !== 'notify') return;
  self.registration.showNotification(d.title || 'Watch Together', {
    body: d.body || '',
    tag: d.tag || 'wt',
    icon: 'logo.svg',
    badge: 'logo.svg',
    renotify: true
  });
});
