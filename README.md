# ngovanxuanduc.com

Trang cá nhân tĩnh (multi-page) của **Ngo Van Xuan Duc**: giới thiệu, lịch âm–dương, countdown Tết, mini-game, bài viết ngắn, và bộ tools chạy trên trình duyệt.

- **Stack:** HTML / CSS / JavaScript thuần + build Node (không framework SPA)
- **Domain:** [ngovanxuanduc.com](https://ngovanxuanduc.com)
- **Deploy:** GitHub Pages (branch/root như code cũ) hoặc Cloudflare Pages (`dist/`)

---

## Yêu cầu

- [Node.js](https://nodejs.org/) **≥ 18**
- Không cần `npm install` cho build (chỉ Node built-in).  
  `npm run dev` dùng `npx serve` (tải tạm khi chạy).

---

## Bắt đầu nhanh

```bash
# Build → dist/ + copy site ra root (để GitHub Pages branch hoạt động)
npm run build

# Build + serve local tại http://localhost:3000
npm run dev

# Tự build lại khi sửa src/ hoặc public/
npm run watch
```

| Lệnh | Mô tả |
|------|--------|
| `npm run build` | Generate `dist/` **và** publish ra root repo |
| `npm run dev` | Build rồi serve `dist` (port 3000) |
| `npm run watch` | Rebuild khi file thay đổi |
| `npm run clean` | Xóa `dist/` |

---

## Cấu trúc project

```
.
├── src/                    # Source (sửa ở đây)
│   ├── data/               # site.json, tools.json
│   ├── layouts/            # base.html
│   ├── partials/           # nav, footer, GTM
│   └── pages/              # Nội dung trang + front matter
├── public/                 # css, js, favicon, CNAME, SW…
├── scripts/build.js
├── dist/                   # Output build (gitignore)
├── index.html, css/, …     # Bản publish ở root (sau npm run build) — commit cái này để Pages branch chạy
└── package.json
```

**Không phải SPA.** Layout ghép lúc build.  
**Source** = `src/` + `public/`. **Bản online** = file HTML/css/js ở root (sau build), giống cách code cũ.

---

## Trang (pages)

Mỗi file trong `src/pages/` có **JSON front matter** rồi HTML body:

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

Sửa site-wide: `src/data/site.json` và `src/partials/`.

---

## Tools

Hub `/tools/` generate từ `src/data/tools.json`.

```bash
node scripts/add-tool.js --slug slugify --title "Slugify" --cat string --meta "text → slug"
npm run build
```

Rồi chỉnh `src/pages/tools/<slug>.html` + `public/js/tools/<slug>.js`.

---

## Deploy

### Vì sao code cũ “bình thường”?

Code cũ có `index.html` **ngay root repo** → Settings Pages = *branch main / root* là xong.

Sau refactor, source nằm trong `src/`. Nếu **không build** rồi commit file root, GitHub chỉ thấy README → 404 / trang README.

`npm run build` giờ **copy site ra root** lại (như code cũ).

### GitHub Pages (khuyên dùng — giống trước)

1. `npm run build`
2. `git add` các file publish: `index.html`, `404.html`, `calendar.html`, `css/`, `js/`, `tools/`, `games/`, `articles/`, `CNAME`, `favicon.ico`, `.nojekyll`, `firebase-messaging-sw.js`, …
3. Commit + push `main`
4. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** / folder **`/ (root)`**
5. Custom domain: `ngovanxuanduc.com` → Save → **Enforce HTTPS**

### Cloudflare Pages

1. Build: `npm run build`
2. Output: **`dist`**
3. Custom domain `ngovanxuanduc.com`

### DNS → GitHub

Apex — 4 bản ghi **A**:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

hoặc `www` CNAME → `ngovanxuanduc.github.io`

### URL

| URL | Ghi chú |
|-----|---------|
| **https://ngovanxuanduc.com/** | Dùng cái này |
| `https://ngovanxuanduc.github.io/ngovanxuanduc/` | Project path; path `/css` có thể lệch — không cần dùng |

---

## Local preview

```bash
npm run dev
# → http://localhost:3000
```

---

## License

Private / personal site — © Ngo Van Xuan Duc.
