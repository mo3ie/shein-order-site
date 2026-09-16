/* عامل الخدمة: يستقبل الإشعارات والصفحة مغلقة.
 *
 * قياس السلة يستغرق دقائق، والزبون يغلق المتصفح ويذهب — فلا يعرف متى انتهى.
 * هذا العامل يظل حيًّا عند النظام لا عند الصفحة، فيصل الخبر إلى الهاتف ولو لم
 * يكن الموقع مفتوحًا. ونقرة الإشعار تفتح الشاشة المعنيّة مباشرة، ولا تفتح
 * تبويبًا ثانيًا إن كان الموقع مفتوحًا أصلاً.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }

  const title = data.title || "ترند · شي إن";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.png",
    badge: "/logo.png",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "trend-notice",
    renotify: true,
    // الاهتزاز يجعل الخبر يُلتقط والهاتف في الجيب.
    vibrate: [90, 40, 90],
    data: { url: data.url || "/" },
    requireInteraction: !!data.important,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      // تبويب الموقع مفتوح: انقله إلى الوجهة بدل فتح نسخة أخرى منه.
      if (client.url.includes(self.location.origin)) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
