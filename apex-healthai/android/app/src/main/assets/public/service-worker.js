const CACHE_NAME = 'apex-workout-local-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './vendor/fonts/fonts.css',
  './vendor/fonts/sora-latin.woff2',
  './vendor/fonts/manrope-latin.woff2',
  './vendor/phosphor/style.css',
  './vendor/phosphor/Phosphor.woff2',
  './assets/apex-mark.png',
  './assets/apex-logo.jpg',
  './assets/intro-app.mp4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
