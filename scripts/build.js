/**
 * Static site builder
 * - public/  -> dist/
 * - src/pages/*.html (+ front matter) -> dist via layout
 * - src/data/tools.json -> dist/tools/index.html (hub)
 *
 * Front matter (JSON between --- lines):
 * { "title": "...", "description": "...", "page": "tools", "scripts": ["..."] }
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");
const PAGES = path.join(SRC, "pages");

/** CLI: production = minify + publish root; dev/watch = --no-minify --no-publish */
const ARGS = process.argv.slice(2);
const DO_MINIFY = !ARGS.includes("--no-minify");
const DO_PUBLISH = !ARGS.includes("--no-publish");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function escapeAttr(s) {
  // Decode common entities first so we don't turn &amp; into &amp;amp;
  const decoded = String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return decoded
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(s) {
  return escapeAttr(s);
}

function apply(template, data) {
  let out = template;
  for (const [k, v] of Object.entries(data)) {
    out = out.split(`{{${k}}}`).join(v == null ? "" : String(v));
  }
  // leave unknown tags empty-ish warning
  return out;
}

function parsePage(raw) {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { meta: {}, content: trimmed };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, content: trimmed };
  const fm = trimmed.slice(3, end).trim();
  const content = trimmed.slice(end + 4).replace(/^\r?\n/, "");
  let meta = {};
  try {
    meta = JSON.parse(fm);
  } catch (e) {
    throw new Error("Invalid JSON front matter: " + e.message + "\n" + fm.slice(0, 200));
  }
  return { meta, content };
}

function renderNav(site, activePage) {
  const items = site.nav
    .map((item) => {
      const active = item.id === activePage ? ' class="is-active"' : "";
      return `          <li><a href="${item.href}" data-nav="${item.id}"${active}>${item.label}</a></li>`;
    })
    .join("\n");
  return apply(read(path.join(SRC, "partials", "nav.html")), {
    logo: site.logo,
    navItems: items,
  });
}

function renderScripts(list) {
  if (!list || !list.length) return "";
  // defer: không chặn first paint; vẫn chạy theo thứ tự sau khi parse HTML
  return list
    .map((src) => `    <script src="${src}" defer></script>`)
    .join("\n");
}

/** Which CSS bundles a page needs (keeps home free of tools/games/calendar CSS). */
function stylesheetsFor(page, relPath) {
  const p = String(relPath || "").replace(/\\/g, "/");
  // fonts.css: desktop-only (media) — mobile uses system fonts (~87KB saved)
  const sheets = [
    { href: "/css/fonts.css", media: "(min-width: 721px)" },
    { href: "/css/style.css" },
  ];
  const isTools =
    page === "tools" || p === "tools/index.html" || p.startsWith("tools/");
  const isGames =
    page === "games" || p === "games/index.html" || p.startsWith("games/");
  const isCalendar =
    page === "calendar" || p === "calendar.html" || p.endsWith("/calendar.html");
  if (isTools) sheets.push({ href: "/css/tools.css" });
  if (isGames) sheets.push({ href: "/css/games.css" });
  if (isCalendar) sheets.push({ href: "/css/calendar.css" });
  return sheets;
}

function renderStylesheets(list) {
  // No preload+stylesheet double for same file (wastes bandwidth on slow mobile)
  return list
    .map((item) => {
      const href = typeof item === "string" ? item : item.href;
      const media = typeof item === "string" ? null : item.media;
      if (media) {
        // media query: mobile browsers skip download (or lowest priority)
        return `    <link rel="stylesheet" href="${href}" media="${media}" />`;
      }
      return `    <link rel="stylesheet" href="${href}" />`;
    })
    .join("\n");
}

/** Lightweight CSS minify — safe enough for our hand-written CSS. */
function minifyCss(css) {
  return String(css)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

/**
 * Lightweight JS minify (no npm deps).
 * Strips comments + collapses whitespace while preserving strings, templates, regex.
 * Not a full mangler (no rename vars) — safe for hand-written site JS.
 * Source stays readable in public/; only dist/ (and published root) is minified.
 */
function minifyJs(code) {
  const src = String(code);
  let out = "";
  let i = 0;
  const n = src.length;
  let prevNonSpace = "";

  function isIdentEnd(ch) {
    return /[A-Za-z0-9_$]/.test(ch);
  }

  function lastSignificant() {
    for (let k = out.length - 1; k >= 0; k--) {
      const c = out[k];
      if (c === " " || c === "\n" || c === "\t") continue;
      return c;
    }
    return "";
  }

  function canStartRegex() {
    // Safer false-negative (treat as division) than false-positive (break code).
    const p = lastSignificant();
    if (!p) return true;
    // after these, / usually starts a regex literal
    return /[=(:,;!?&|+\-~^\[{?]/.test(p) || p === "}" || p === "\n";
  }

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    // line comment
    if (c === "/" && next === "/") {
      i += 2;
      while (i < n && src[i] !== "\n" && src[i] !== "\r") i++;
      continue;
    }

    // block comment
    if (c === "/" && next === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      // keep a space if comment sat between identifiers
      if (isIdentEnd(prevNonSpace) && isIdentEnd(src[i] || "")) out += " ";
      continue;
    }

    // strings ' " `
    if (c === "'" || c === '"' || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < n) {
        const ch = src[i];
        out += ch;
        if (ch === "\\") {
          i++;
          if (i < n) {
            out += src[i];
            i++;
          }
          continue;
        }
        if (q === "`" && ch === "$" && src[i + 1] === "{") {
          // template expression — recurse-ish by emitting until matching }
          out += "{";
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            // nested strings inside ${}
            const t = src[i];
            if (t === "'" || t === '"' || t === "`") {
              const qq = t;
              out += t;
              i++;
              while (i < n) {
                const th = src[i];
                out += th;
                if (th === "\\") {
                  i++;
                  if (i < n) {
                    out += src[i];
                    i++;
                  }
                  continue;
                }
                if (th === qq) {
                  i++;
                  break;
                }
                i++;
              }
              continue;
            }
            if (t === "/" && src[i + 1] === "/") {
              i += 2;
              while (i < n && src[i] !== "\n") i++;
              continue;
            }
            if (t === "/" && src[i + 1] === "*") {
              i += 2;
              while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
              i += 2;
              continue;
            }
            if (t === "{") depth++;
            if (t === "}") {
              depth--;
              if (depth === 0) {
                out += "}";
                i++;
                break;
              }
            }
            out += t;
            i++;
          }
          continue;
        }
        if (ch === q) {
          i++;
          break;
        }
        i++;
      }
      prevNonSpace = q;
      continue;
    }

    // regex literal (heuristic)
    if (c === "/" && canStartRegex()) {
      // avoid treating /= or comments (already handled)
      out += "/";
      i++;
      let inClass = false;
      while (i < n) {
        const ch = src[i];
        out += ch;
        if (ch === "\\" && i + 1 < n) {
          out += src[i + 1];
          i += 2;
          continue;
        }
        if (ch === "[") inClass = true;
        else if (ch === "]") inClass = false;
        else if (ch === "/" && !inClass) {
          i++;
          // flags
          while (i < n && /[a-z]/i.test(src[i])) {
            out += src[i];
            i++;
          }
          break;
        }
        i++;
      }
      prevNonSpace = "/";
      continue;
    }

    // whitespace collapse
    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
      // find next non-space
      let j = i + 1;
      while (
        j < n &&
        (src[j] === " " ||
          src[j] === "\t" ||
          src[j] === "\n" ||
          src[j] === "\r" ||
          src[j] === "\f")
      )
        j++;
      const nextCh = src[j] || "";
      const needSpace =
        isIdentEnd(prevNonSpace) &&
        (isIdentEnd(nextCh) ||
          nextCh === "\\" || // rare
          false);
      // also: return\nfoo → return foo
      if (needSpace) {
        out += " ";
        prevNonSpace = " ";
      }
      // ASI safety: keep newline after return/throw/break/continue/yield when next is not ;
      const kw = out.match(/(?:^|[^A-Za-z0-9_$])(return|throw|break|continue|yield)$/);
      if (
        kw &&
        (c === "\n" || src.slice(i, j).includes("\n")) &&
        nextCh &&
        nextCh !== ";" &&
        nextCh !== "}" &&
        nextCh !== ")"
      ) {
        if (!out.endsWith(" ") && !out.endsWith("\n")) out += "\n";
      }
      i = j;
      continue;
    }

    out += c;
    if (c !== " " && c !== "\n" && c !== "\t") prevNonSpace = c;
    i++;
  }

  return out.trim();
}

/** Walk dist and minify all .js files in place. */
function minifyJsTree(dir) {
  if (!fs.existsSync(dir)) return { files: 0, before: 0, after: 0 };
  let files = 0;
  let before = 0;
  let after = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const sub = minifyJsTree(p);
      files += sub.files;
      before += sub.before;
      after += sub.after;
      continue;
    }
    if (!ent.name.endsWith(".js")) continue;
    // service workers often cache-sensitive; still minify content OK
    const raw = read(p);
    const min = minifyJs(raw);
    write(p, min);
    files++;
    before += raw.length;
    after += min.length;
  }
  return { files, before, after };
}

function siteOrigin(site) {
  const base = (site.url || "https://" + (site.domain || "localhost")).replace(
    /\/$/,
    ""
  );
  return base;
}

/** Absolute public URL for a built page path (relative to dist/). */
function pageCanonicalUrl(site, relPath) {
  const origin = siteOrigin(site);
  let p = String(relPath || "").replace(/\\/g, "/");
  if (p === "index.html" || p === "/index.html" || p === "") return origin + "/";
  if (p.endsWith("/index.html")) {
    p = p.slice(0, -"index.html".length);
    return origin + "/" + p.replace(/^\//, "");
  }
  if (!p.startsWith("/")) p = "/" + p;
  return origin + p;
}

function absoluteAssetUrl(site, assetPath) {
  const origin = siteOrigin(site);
  const p = String(assetPath || "/og-image.jpg");
  if (/^https?:\/\//i.test(p)) return p;
  return origin + (p.startsWith("/") ? p : "/" + p);
}

function buildPage(relPath, raw, site, layout) {
  const { meta, content } = parsePage(raw);
  const title = meta.title || site.name;
  const description =
    meta.description || site.description || site.name;
  const page = meta.page || "";
  const scripts = renderScripts(meta.scripts || []);
  const extraHead = meta.extraHead || "";
  const robots = meta.robots
    ? `<meta name="robots" content="${escapeHtml(meta.robots)}" />`
    : "";

  const ogTitle = meta.ogTitle || title;
  const ogDescription = meta.ogDescription || description;
  const ogType = meta.ogType || (page === "home" || !page ? "website" : "website");
  const canonicalUrl =
    meta.canonical || pageCanonicalUrl(site, relPath);
  const ogImage = absoluteAssetUrl(
    site,
    meta.ogImage || site.ogImage || "/og-image.jpg"
  );

  const stylesheets = renderStylesheets(stylesheetsFor(page, relPath));

  return apply(layout, {
    lang: site.lang || "vi",
    title: escapeHtml(title),
    description: escapeHtml(description),
    page: escapeHtml(page),
    robots,
    extraHead,
    scripts,
    stylesheets,
    content,
    siteName: escapeHtml(site.name || site.domain || ""),
    canonicalUrl: escapeAttr(canonicalUrl),
    ogTitle: escapeHtml(ogTitle),
    ogDescription: escapeHtml(ogDescription),
    ogType: escapeAttr(ogType),
    ogImage: escapeAttr(ogImage),
    gtmHead: apply(read(path.join(SRC, "partials", "gtm-head.html")), {
      gtmId: site.gtmId,
    }),
    gtmBody: apply(read(path.join(SRC, "partials", "gtm-body.html")), {
      gtmId: site.gtmId,
    }),
    gtmDeferred: apply(read(path.join(SRC, "partials", "gtm-deferred.html")), {
      gtmId: site.gtmId,
    }),
    nav: renderNav(site, page),
    footer: apply(read(path.join(SRC, "partials", "footer.html")), {
      name: site.name,
    }),
  });
}

function buildToolsHub(site, layout, toolsData) {
  const chips = [
    { id: "all", label: "All" },
    ...toolsData.categories.map((c) => ({ id: c.id, label: c.label })),
  ]
    .map(
      (c, i) =>
        `              <button type="button" class="tools-chip${
          i === 0 ? " is-active" : ""
        }" data-cat="${c.id}">${escapeHtml(c.label)}</button>`
    )
    .join("\n");

  const groups = toolsData.categories
    .map((cat) => {
      const links = cat.tools
        .map((t) => {
          const href = t.href || `/tools/${t.slug}.html`;
          return `            <a class="tool-link" href="${href}" data-cat="${
            cat.id
          }" data-search="${escapeHtml(t.search || "")}" title="${escapeHtml(
            t.description || t.title
          )}">
              <span class="tool-link__icon">${t.icon || "•"}</span>
              <span class="tool-link__body"><span class="tool-link__title">${escapeHtml(
                t.title
              )}</span><span class="tool-link__meta">${escapeHtml(
            t.meta || ""
          )}</span></span>
            </a>`;
        })
        .join("\n");
      return `        <section class="tools-group" data-group="${cat.id}">
          <div class="tools-group__head">
            <h2 class="tools-group__title">${escapeHtml(cat.title)}</h2>
            <span class="tools-group__n"></span>
          </div>
          <div class="tools-list">
${links}
          </div>
        </section>`;
    })
    .join("\n\n");

  const content = `      <div class="container container--tools" id="tools-hub">
        <div class="page-intro" style="margin-bottom: 0.75rem">
          <h1>Tools</h1>
          <p>
            Offline trên trình duyệt. Gõ <kbd style="font-family:var(--mono);font-size:0.8em;padding:0.1em 0.35em;border:1px solid var(--border);border-radius:4px">/</kbd> để tìm nhanh.
          </p>
        </div>

        <div class="tools-bar">
          <div class="tools-bar__row">
            <input
              type="search"
              id="tools-search"
              class="tools-search"
              placeholder="Tìm tool… (diff, base64, json…)"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="tools-chips" role="tablist" aria-label="Categories">
${chips}
            </div>
            <span class="tools-count" id="tools-count"></span>
          </div>
        </div>

        <div class="tools-empty" id="tools-empty">Không có tool khớp — thử từ khóa khác.</div>

${groups}
      </div>`;

  const pageRaw = `---
${JSON.stringify(
  {
    title: "Tools · " + site.name,
    description:
      "Tools offline — string, encode, JSON, number, time. Chạy trên trình duyệt.",
    page: "tools",
    scripts: ["/js/tools/hub.js"],
  },
  null,
  2
)}
---
${content}
`;
  return buildPage("tools/index.html", pageRaw, site, layout);
}

/**
 * GitHub Pages "Deploy from a branch / root" (cách code cũ):
 * publish bản build ra root repo (cạnh src/), không chỉ dist/.
 * Không đụng src/, scripts/, .git, package.json, README, v.v.
 */
const ROOT_PUBLISH = [
  "index.html",
  "calendar.html",
  "404.html",
  "favicon.ico",
  "og-image.jpg",
  "og-image.svg",
  "CNAME",
  "firebase-messaging-sw.js",
  "_redirects",
  ".nojekyll",
  "serve.json",
  "css",
  "js",
  "fonts",
  "tools",
  "games",
  "articles",
];

function cleanRootPublish() {
  for (const name of ROOT_PUBLISH) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) rmrf(p);
  }
}

function publishRoot() {
  cleanRootPublish();
  for (const name of ROOT_PUBLISH) {
    const from = path.join(DIST, name);
    const to = path.join(ROOT, name);
    if (!fs.existsSync(from)) continue;
    const st = fs.statSync(from);
    if (st.isDirectory()) copyDir(from, to);
    else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
  console.log("Published → repo root (GitHub Pages branch/root ready)");
}

function main() {
  const site = JSON.parse(read(path.join(SRC, "data", "site.json")));
  const toolsData = JSON.parse(read(path.join(SRC, "data", "tools.json")));
  const layout = read(path.join(SRC, "layouts", "base.html"));

  const modeLabel = DO_MINIFY ? "production (minify)" : "dev (readable assets)";
  console.log(`Building → dist/  [${modeLabel}]`);
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  // 1) static assets
  copyDir(PUBLIC, DIST);

  // 1b–1c) minify only for production build (source in public/ always readable)
  if (DO_MINIFY) {
    const cssDir = path.join(DIST, "css");
    if (fs.existsSync(cssDir)) {
      for (const name of fs.readdirSync(cssDir)) {
        if (!name.endsWith(".css")) continue;
        const p = path.join(cssDir, name);
        const raw = read(p);
        const min = minifyCss(raw);
        write(p, min);
        console.log(
          `  CSS ${name}: ${(raw.length / 1024).toFixed(1)}KB → ${(min.length / 1024).toFixed(1)}KB`
        );
      }
    }

    const jsStats = minifyJsTree(path.join(DIST, "js"));
    const swPath = path.join(DIST, "firebase-messaging-sw.js");
    if (fs.existsSync(swPath)) {
      const raw = read(swPath);
      const min = minifyJs(raw);
      write(swPath, min);
      jsStats.files++;
      jsStats.before += raw.length;
      jsStats.after += min.length;
    }
    if (jsStats.files) {
      console.log(
        `  JS: ${jsStats.files} files ${(jsStats.before / 1024).toFixed(1)}KB → ${(jsStats.after / 1024).toFixed(1)}KB (−${(((jsStats.before - jsStats.after) / jsStats.before) * 100) | 0}%)`
      );
    }
  } else {
    console.log("  skip minify (edit public/css + public/js; DevTools stays readable)");
  }

  // 2) pages
  const pageFiles = walk(PAGES).filter((f) => f.endsWith(".html"));
  let count = 0;
  for (const file of pageFiles) {
    const rel = path.relative(PAGES, file).replace(/\\/g, "/");
    // tools/index.html is generated
    if (rel === "tools/index.html") continue;
    const html = buildPage(rel, read(file), site, layout);
    write(path.join(DIST, rel), html);
    count++;
  }

  // 3) tools hub from registry
  write(path.join(DIST, "tools", "index.html"), buildToolsHub(site, layout, toolsData));
  count++;

  console.log(`Built ${count} pages + public assets → dist/`);

  // 4) copy ra root — production only (tránh overwrite publish bằng bản unminified lúc dev)
  if (DO_PUBLISH) {
    publishRoot();
  } else {
    console.log("  skip publish root (--no-publish)");
  }
}

main();
