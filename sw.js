// Service Worker لتطبيق خلية الحروف
const CACHE_NAME = 'word-cell-game-v2.3.0';
const urlsToCache = [
  './',
  './index.html',
  './styles.css?v=2.3',
  './script-firebase.js?v=2.3',
  './firebase-manager.js?v=2.3',
  './firebase-config.js?v=2.3',
  './questions.js?v=2.0',
  './config.js?v=2.0',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// استجابة للطلبات
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إرجاع الاستجابة من الذاكرة المؤقتة إذا وُجدت
        if (response) {
          return response;
        }

        // نسخ الطلب لأنه stream يمكن استهلاكه مرة واحدة فقط
        let fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // التحقق من صحة الاستجابة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة لأنه stream يمكن استهلاكه مرة واحدة فقط
            let responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // إرجاع صفحة افتراضية في حالة عدم توفر الإنترنت
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// معالجة رسائل من الصفحة الرئيسية
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعارات اللعبة (اختيارية)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// مزامنة البيانات في الخلفية
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // مزامنة نتائج اللعبة أو الإحصائيات
  return new Promise(function(resolve) {
    // يمكن إضافة منطق مزامنة البيانات هنا
    resolve();
  });
}
