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
  return list
    .map((src) => `    <script src="${src}"></script>`)
    .join("\n");
}

function buildPage(relPath, raw, site, layout) {
  const { meta, content } = parsePage(raw);
  const title = meta.title || site.name;
  const description = meta.description || site.name;
  const page = meta.page || "";
  const scripts = renderScripts(meta.scripts || []);
  const extraHead = meta.extraHead || "";
  const robots = meta.robots
    ? `<meta name="robots" content="${escapeHtml(meta.robots)}" />`
    : "";

  const html = apply(layout, {
    lang: site.lang || "vi",
    title: escapeHtml(title),
    description: escapeHtml(description),
    page: escapeHtml(page),
    robots,
    extraHead,
    scripts,
    content: content.replace(/^/gm, "      ").replace(/^\s+$/gm, ""),
    gtmHead: apply(read(path.join(SRC, "partials", "gtm-head.html")), {
      gtmId: site.gtmId,
    }),
    gtmBody: apply(read(path.join(SRC, "partials", "gtm-body.html")), {
      gtmId: site.gtmId,
    }),
    nav: renderNav(site, page),
    footer: apply(read(path.join(SRC, "partials", "footer.html")), {
      name: site.name,
    }),
  });

  // content indent fix: don't over-indent; re-render content cleanly
  return apply(layout, {
    lang: site.lang || "vi",
    title: escapeHtml(title),
    description: escapeHtml(description),
    page: escapeHtml(page),
    robots,
    extraHead,
    scripts,
    content,
    gtmHead: apply(read(path.join(SRC, "partials", "gtm-head.html")), {
      gtmId: site.gtmId,
    }),
    gtmBody: apply(read(path.join(SRC, "partials", "gtm-body.html")), {
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

function main() {
  const site = JSON.parse(read(path.join(SRC, "data", "site.json")));
  const toolsData = JSON.parse(read(path.join(SRC, "data", "tools.json")));
  const layout = read(path.join(SRC, "layouts", "base.html"));

  console.log("Building → dist/");
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  // 1) static assets
  copyDir(PUBLIC, DIST);

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
}

main();
