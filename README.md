# ngovanxuanduc.com

Trang cá nhân tĩnh (multi-page) của **Ngo Van Xuan Duc**: giới thiệu, lịch âm–dương, countdown Tết, mini-games, bài viết ngắn, và bộ tools chạy trên trình duyệt.

- **Stack:** HTML / CSS / JavaScript thuần + build Node (không framework SPA)
- **Domain:** [ngovanxuanduc.com](https://ngovanxuanduc.com)
- **Deploy:** GitHub Pages hoặc Cloudflare Pages (`dist/`)

---

## Yêu cầu

- [Node.js](https://nodejs.org/) **≥ 18**
- Không cần `npm install` cho build (chỉ Node built-in).  
  `npm run dev` dùng `npx serve` (tải tạm khi chạy).

---

## Bắt đầu nhanh

```bash
# Build ra thư mục dist/
npm run build

# Build + serve local tại http://localhost:3000
npm run dev

# Tự build lại khi sửa src/ hoặc public/
npm run watch
```

| Lệnh | Mô tả |
|------|--------|
| `npm run build` | Generate site → `dist/` |
| `npm run dev` | Build rồi serve `dist` (port 3000) |
| `npm run watch` | Rebuild khi file thay đổi |
| `npm run clean` | Xóa `dist/` |

---

## Cấu trúc project

```
.
├── src/
│   ├── data/
│   │   ├── site.json       # Tên site, nav, GTM…
│   │   └── tools.json      # Registry Tools hub (categories + tools)
│   ├── layouts/
│   │   └── base.html       # Layout chung
│   ├── partials/           # nav, footer, GTM
│   └── pages/              # Nội dung từng trang (+ front matter)
│       ├── index.html
│       ├── calendar.html
│       ├── 404.html
│       ├── tools/          # Mỗi tool 1 page (hub generate từ tools.json)
│       ├── games/
│       └── articles/
├── public/                 # Asset copy nguyên sang dist
│   ├── css/
│   ├── js/
│   ├── favicon.ico
│   ├── CNAME
│   ├── firebase-messaging-sw.js
│   ├── _redirects          # Cloudflare Pages
│   └── .nojekyll           # GitHub Pages
├── scripts/
│   ├── build.js            # Builder chính
│   ├── add-tool.js         # Scaffold tool mới
│   └── watch.js
├── dist/                   # Output (gitignore) — deploy folder này
├── package.json
└── .github/workflows/      # Deploy GitHub Pages (Actions)
```

**Không phải SPA:** mỗi URL là một file HTML tĩnh. Layout/nav/footer được ghép lúc build.

---

## Trang (pages)

Mỗi file trong `src/pages/` có **JSON front matter** rồi tới HTML body (chỉ phần trong `<main>`):

```html
---
{
  "title": "Base64 · Tools",
  "description": "Encode / decode Base64…",
  "page": "tools",
  "scripts": [
    "/js/tools/lib.js",
    "/js/tools/base64.js"
  ]
}
---
<div class="container">
  <!-- nội dung -->
</div>
```

| Field | Ý nghĩa |
|--------|---------|
| `title` | `<title>` |
| `description` | meta description |
| `page` | `data-page` + active nav (`home`, `tools`, `games`…) |
| `scripts` | Script thêm (sau `/js/main.js`) |
| `extraHead` | HTML nhét thêm vào `<head>` (CSS inline…) |
| `robots` | Ví dụ `noindex` cho 404 |

Sửa site-wide (logo, menu, GTM): `src/data/site.json` và `src/partials/`.

---

## Tools

### Hub

Danh sách tool trên `/tools/` được **generate** từ `src/data/tools.json` (không sửa tay file hub trong `pages`).

### Thêm tool mới

```bash
node scripts/add-tool.js --slug slugify --title "Slugify" --cat string --meta "text → slug" --icon "#"
npm run build
```

| Flag | Mô tả |
|------|--------|
| `--slug` | Tên file (`slugify` → `slugify.html` / `slugify.js`) |
| `--title` | Tiêu đề |
| `--cat` | Category id trong `tools.json` (`string`, `encode`, `json`, `number`, `browser`, `firebase`) |
| `--meta` | Mô tả ngắn trên hub |
| `--icon` | Icon text ngắn |

Sau đó chỉnh:

1. `src/pages/tools/<slug>.html` — UI  
2. `public/js/tools/<slug>.js` — logic  
3. (tuỳ chọn) entry trong `src/data/tools.json` nếu scaffold chưa đủ  

### Categories hiện có

- **String** — diff, set ops, fuzzy, sort, regex…  
- **Encode** — Base64, URL, hash, UUID…  
- **JSON** — format, CSV, JWT…  
- **Number** — base convert, timestamp, color…  
- **Browser** — UA, IP  
- **Firebase** — FCM Web Push test (cần HTTPS + config Firebase)

Hầu hết tool **offline** (không API). Ngoại lệ: *What is my IP*, *FCM test*.

---

## Deploy

Build output luôn là **`dist/`**. Deploy **gốc domain** (custom domain), không deploy dạng `user.github.io/repo-name/` vì site dùng absolute path (`/tools/…`, `/css/…`).

### Cloudflare Pages

1. Connect repo  
2. **Build command:** `npm run build`  
3. **Build output directory:** `dist`  
4. Framework preset: **None**  
5. Gắn custom domain `ngovanxuanduc.com`  
6. File `public/_redirects` được copy vào `dist` (pretty URL + 404)

### GitHub Pages

1. Repo Settings → **Pages** → Source: **GitHub Actions**  
2. Workflow sẵn: `.github/workflows/deploy-pages.yml`  
   - Push `main` → build → deploy `dist`  
3. Custom domain: `ngovanxuanduc.com` (`public/CNAME` → `dist/CNAME`)  
4. Bật **Enforce HTTPS**

> Sau khi bật Actions, commit/push để workflow chạy lần đầu.

### Checklist domain

- [ ] DNS trỏ về GitHub / Cloudflare  
- [ ] `public/CNAME` đúng domain  
- [ ] HTTPS bật  
- [ ] FCM (nếu dùng): SW tại `/firebase-messaging-sw.js`, site HTTPS  

---

## Local preview

```bash
npm run dev
# → http://localhost:3000
```

Hoặc:

```bash
npm run build
npx serve dist -l 3000
```

---

## Ghi chú kỹ thuật

| Chủ đề | Chi tiết |
|--------|-----------|
| Absolute paths | Link/asset dạng `/…` — phù hợp custom domain ở root |
| 404 | `src/pages/404.html` → `dist/404.html` |
| FCM | `public/firebase-messaging-sw.js` scope `/` |
| Analytics | GTM id trong `src/data/site.json` |
| Không commit `dist/` | Có trong `.gitignore`; CI/CD build lại mỗi lần deploy |

---

## Roadmap mở rộng gợi ý

- Thêm tool: `add-tool.js` + `tools.json`  
- Thêm section site: page mới trong `src/pages/` + item `nav` trong `site.json`  
- Theme / design tokens: `public/css/style.css` (`:root`)  
- (Tuỳ chọn) i18n, blog markdown, tests cho `scripts/build.js`  

---

## License

Private / personal site — © Ngo Van Xuan Duc.
