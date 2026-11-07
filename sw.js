// Service worker: приложение открывается даже без сети (оболочка из кэша), данные — всегда свежие с GitHub.
const CACHE = "home-net-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
	"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"];

self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
	e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
		.then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
	const url = new URL(e.request.url);
	// GitHub API и Gist — только сеть: статус и команды не кэшируем
	if (e.request.method !== "GET" || /github(usercontent)?\.com$/.test(url.hostname) && url.hostname !== location.hostname) return;
	// Оболочка: сначала сеть (чтобы обновления сайта приходили сразу), без сети — кэш
	e.respondWith(
		fetch(e.request)
			.then((r) => {
				if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
				return r;
			})
			.catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
	);
});
