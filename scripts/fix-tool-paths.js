/**
 * 1) Make tools hub links root-absolute (/tools/...)
 * 2) Normalize tool page nav/back links for clean URLs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const toolsDir = path.join(root, "tools");

// --- hub ---
let hub = fs.readFileSync(path.join(toolsDir, "index.html"), "utf8");
// tool cards: href="foo.html" -> href="/tools/foo.html"
hub = hub.replace(
  /href="([a-z0-9-]+)\.html"/gi,
  (m, name) => {
    if (name === "index") return 'href="/tools/"';
    return `href="/tools/${name}.html"`;
  }
);
// search placeholder already fine
fs.writeFileSync(path.join(toolsDir, "index.html"), hub, "utf8");
console.log("fixed tools/index.html links");

// --- each tool page ---
const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith(".html") && f !== "index.html");
for (const file of files) {
  let html = fs.readFileSync(path.join(toolsDir, file), "utf8");
  let before = html;

  // logo / home
  html = html.replace(/href="\.\.\/index\.html"/g, 'href="/"');
  // calendar
  html = html.replace(/href="\.\.\/calendar\.html"/g, 'href="/calendar.html"');
  // tools nav self
  html = html.replace(
    /href="index\.html" data-nav="tools"/g,
    'href="/tools/" data-nav="tools"'
  );
  // games / articles
  html = html.replace(/href="\.\.\/games\/index\.html"/g, 'href="/games/"');
  html = html.replace(/href="\.\.\/articles\/index\.html"/g, 'href="/articles/"');
  // back to tools
  html = html.replace(
    /class="game-header__back" href="index\.html"/g,
    'class="game-header__back" href="/tools/"'
  );
  // footer tools
  html = html.replace(
    /<li><a href="index\.html">Tools<\/a><\/li>/g,
    '<li><a href="/tools/">Tools</a></li>'
  );
  // favicon
  html = html.replace(/href="\.\.\/favicon\.ico"/g, 'href="/favicon.ico"');
  // css/js absolute from root (works from any path)
  html = html.replace(/href="\.\.\/css\/style\.css"/g, 'href="/css/style.css"');
  html = html.replace(/src="\.\.\/js\//g, 'src="/js/');

  if (html !== before) {
    fs.writeFileSync(path.join(toolsDir, file), html, "utf8");
    console.log("fixed", file);
  }
}

// root index/calendar/game links to tools with trailing slash preference
for (const rel of ["index.html", "calendar.html"]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, "utf8");
  const next = html
    .replace(/href="tools\/index\.html"/g, 'href="/tools/"')
    .replace(/href="tools\/([a-z0-9-]+)\.html"/gi, 'href="/tools/$1.html"');
  if (next !== html) {
    fs.writeFileSync(p, next, "utf8");
    console.log("fixed", rel);
  }
}

// games & articles nav tools links
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) {
      let html = fs.readFileSync(p, "utf8");
      const next = html
        .replace(/href="\.\.\/tools\/index\.html"/g, 'href="/tools/"')
        .replace(/href="\.\.\/index\.html"/g, 'href="/"')
        .replace(/href="\.\.\/calendar\.html"/g, 'href="/calendar.html"')
        .replace(/href="\.\.\/games\/index\.html"/g, 'href="/games/"')
        .replace(/href="\.\.\/articles\/index\.html"/g, 'href="/articles/"')
        .replace(/href="index\.html" data-nav="games"/g, 'href="/games/" data-nav="games"')
        .replace(/href="index\.html" data-nav="articles"/g, 'href="/articles/" data-nav="articles"')
        .replace(/href="index\.html" data-nav="home"/g, 'href="/" data-nav="home"');
      // only for games/articles subpages - carefully
      if (next !== html && (p.includes(`${path.sep}games${path.sep}`) || p.includes(`${path.sep}articles${path.sep}`))) {
        fs.writeFileSync(p, next, "utf8");
        console.log("fixed nav", path.relative(root, p));
      }
    }
  }
}
walk(path.join(root, "games"));
walk(path.join(root, "articles"));

console.log("done");
