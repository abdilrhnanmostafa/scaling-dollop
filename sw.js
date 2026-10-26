/* WASL Service Worker — إشعارات Web Push في الخلفية */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; }
  catch (_) { p = { body: event.data ? event.data.text() : '' }; }

  const title = p.title || 'WASL';
  const options = {
    body: p.body || '',
    icon: p.icon || 'icon-192.png',
    badge: 'badge-96.png',
    tag: p.tag || undefined,
    renotify: !!p.tag,
    data: p.data || {},
    dir: 'rtl',
    lang: 'ar',
    vibrate: [120, 60, 120],
    timestamp: Date.now()
  };

  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const focused = wins.find(c => c.visibilityState === 'visible' && c.focused);
    if (focused) {
      // التطبيق مفتوح أمام المستخدم: لا نعرض إشعار نظام، بل نُعلم الصفحة
      focused.postMessage({ type: 'push-received', title, body: options.body, data: options.data });
      return;
    }
    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if ('focus' in c) {
        await c.focus();
        c.postMessage({ type: 'push-nav', data });
        return;
      }
    }
    const q = new URLSearchParams({ n: data.type || '', from: data.from || '' });
    await self.clients.openWindow('./?' + q.toString());
  })());
});
