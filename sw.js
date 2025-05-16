// sw.js
const CACHE_NAME = 'selda-app-minimal-sw-v1.0'; // Service Worker'ın varlığını göstermek için

// Install olayı: Service Worker'ı yükler ve etkinleştirir.
// Artık dosya önbellekleme yapmıyoruz.
self.addEventListener('install', (event) => {
  console.log(`[ServiceWorker ${CACHE_NAME}] Install event: Skipping pre-caching.`);
  // self.skipWaiting() Service Worker'ın hemen etkinleşmesini sağlar.
  event.waitUntil(self.skipWaiting());
});

// Activate olayı: Eski Service Worker önbelleklerini temizler (artık önbelleğimiz olmasa da iyi bir pratiktir).
self.addEventListener('activate', (event) => {
  console.log(`[ServiceWorker ${CACHE_NAME}] Activate event`);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Bu Service Worker'a ait olmayan eski önbellekleri sil (gerçi artık önbellek kullanmıyoruz)
        if (key !== CACHE_NAME && key.startsWith('selda-app-cache')) { // Daha önceki önbellekleri de hedefleyebiliriz
          console.log(`[ServiceWorker ${CACHE_NAME}] Removing old cache:`, key);
          return caches.delete(key);
        }
      }));
    }).then(() => {
      console.log(`[ServiceWorker ${CACHE_NAME}] Claiming clients.`);
      return self.clients.claim(); // Aktif SW'nin sayfaları hemen kontrol etmesini sağlar
    })
    .catch((error) => {
      console.error(`[ServiceWorker ${CACHE_NAME}] Activation failed:`, error);
    })
  );
});

// Fetch olayı: Artık ağ isteklerini yakalayıp önbellekten sunmaya çalışmıyoruz.
// Tarayıcının varsayılan ağ davranışına izin veriyoruz.
// PWA'nın yüklenmesi ve `display: standalone` için `fetch` handler'ı olması gerekebilir.
// Bu, en basit "pass-through" fetch handler'ıdır.
self.addEventListener('fetch', (event) => {
  // console.log(`[ServiceWorker ${CACHE_NAME}] Fetching:`, event.request.url);
  // Sadece ağa gitmesini söyle, hiçbir şeyi önbelleğe alma veya önbellekten sunma.
  // event.respondWith(fetch(event.request)); // Bu satır olmadan da PWA özellikleri çalışabilir.
  // Eğer sadece A2HS ve standalone için SW gerekiyorsa, fetch handler'ı boş bile olabilir veya hiç olmayabilir.
  // Ancak bazı tarayıcılar PWA olarak tanımak için bir fetch listener bekleyebilir.
  // Şimdilik boş bırakmak veya aşağıdaki gibi minimal bir fetch sağlamak yeterli olabilir.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return; // Sadece GET ve http(s) istekleri için (opsiyonel bir kontrol)
  }
  // Bu, PWA'nın "yüklenebilir" olarak kabul edilmesi için basit bir fetch handler'ıdır.
  // Gerçek bir önbellekleme yapmaz.
  event.respondWith(fetch(event.request).catch(() => {
      // Ağ hatası durumunda ne yapılacağı (opsiyonel)
      // Örneğin, çevrimdışı bir sayfa gösterilebilir, ama bu senaryoda çevrimdışı özelliği kaldırdık.
      // console.warn('[ServiceWorker] Network request failed for:', event.request.url);
      // Sadece hatayı tarayıcıya ilet.
    })
  );
});