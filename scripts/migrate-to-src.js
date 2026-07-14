/**
 * One-shot migration: current root HTML/CSS/JS → src/ + public/
 * Safe to re-run only on original layout (after migrate, use src/).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function extract(html) {
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [, ""])[1].trim();
  const description = (
    html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
    ) || [, ""]
  )[1].trim();
  const page = (html.match(/data-page=["']([^"']+)["']/) || [, ""])[1].trim();
  const robotsM = html.match(
    /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i
  );
  const robots = robotsM ? robotsM[1] : "";

  // scripts except gtm and main.js (main injected by layout)
  const scripts = [];
  const scriptRe = /<script\s+src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(html))) {
    let src = m[1];
    if (src.includes("googletagmanager")) continue;
    // normalize to absolute
    src = src.replace(/^\.\.\//, "/").replace(/^\.\//, "/");
    if (!src.startsWith("/") && !src.startsWith("http")) src = "/" + src;
    if (src === "/js/main.js") continue;
    scripts.push(src);
  }

  // extra head styles
  let extraHead = "";
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let sm;
  while ((sm = styleRe.exec(html))) {
    // skip if inside body? take all head styles — crude: only before </head>
    const idx = html.indexOf("</head>");
    if (sm.index < idx) {
      extraHead += `<style>${sm[1]}</style>\n`;
    }
  }

  // main content
  const mainM = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let content = mainM ? mainM[1].trim() : "";
  // unwrap single container if needed — keep as-is

  // inline body scripts that are not src (year is in layout)
  // skip

  const meta = {
    title,
    description,
    page,
    scripts,
  };
  if (robots) meta.robots = robots;
  if (extraHead.trim()) meta.extraHead = extraHead.trim();

  return { meta, content };
}

function writePage(rel, html) {
  const { meta, content } = extract(html);
  const out = `---\n${JSON.stringify(meta, null, 2)}\n---\n${content}\n`;
  const dest = path.join(ROOT, "src", "pages", rel);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, out, "utf8");
  console.log("page", rel);
}

// --- public assets ---
const publicDir = path.join(ROOT, "public");
ensureDir(publicDir);

if (fs.existsSync(path.join(ROOT, "css"))) {
  copyDir(path.join(ROOT, "css"), path.join(publicDir, "css"));
  console.log("copied css → public/css");
}
if (fs.existsSync(path.join(ROOT, "js"))) {
  copyDir(path.join(ROOT, "js"), path.join(publicDir, "js"));
  console.log("copied js → public/js");
}

for (const f of [
  "favicon.ico",
  "CNAME",
  "firebase-messaging-sw.js",
  "_redirects",
  ".nojekyll",
]) {
  const s = path.join(ROOT, f);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, path.join(publicDir, f));
    console.log("copied", f);
  }
}

// serve.json for local dist serve
fs.writeFileSync(
  path.join(publicDir, "serve.json"),
  JSON.stringify({ cleanUrls: true, trailingSlash: false, directoryListing: false }, null, 2)
);

// --- pages ---
const pageRoots = [
  "index.html",
  "calendar.html",
  "404.html",
];
for (const f of pageRoots) {
  writePage(f, fs.readFileSync(path.join(ROOT, f), "utf8"));
}

for (const dir of ["tools", "games", "articles"]) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith(".html")) continue;
    // tools/index.html generated from tools.json — still migrate as fallback skip later
    writePage(path.join(dir, f), fs.readFileSync(path.join(d, f), "utf8"));
  }
}

console.log("Migration extract done. Run: node scripts/build.js");
