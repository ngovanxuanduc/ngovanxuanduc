/**
 * Scaffold a new offline tool page + registry entry.
 *
 * Usage:
 *   node scripts/add-tool.js --slug my-tool --title "My Tool" --cat string --meta "short"
 */
const fs = require("fs");
const path = require("path");

function arg(name, fallback) {
  const i = process.argv.indexOf("--" + name);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

const slug = arg("slug");
const title = arg("title", slug);
const cat = arg("cat", "string");
const meta = arg("meta", "");
const icon = arg("icon", "•");

if (!slug) {
  console.error(
    'Usage: node scripts/add-tool.js --slug my-tool --title "My Tool" --cat string'
  );
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");
const pagePath = path.join(ROOT, "src", "pages", "tools", slug + ".html");
const jsPath = path.join(ROOT, "public", "js", "tools", slug + ".js");
const toolsJsonPath = path.join(ROOT, "src", "data", "tools.json");

if (fs.existsSync(pagePath)) {
  console.error("Page already exists:", pagePath);
  process.exit(1);
}

const page = `---
{
  "title": ${JSON.stringify(title + " · Tools")},
  "description": ${JSON.stringify(meta || title)},
  "page": "tools",
  "scripts": [
    "/js/tools/lib.js",
    "/js/tools/${slug}.js"
  ]
}
---
<div class="container container--cal">
  <div class="game-header">
    <a class="game-header__back" href="/tools/">← Tools</a>
    <h1>${title}</h1>
    <p>${meta || title}</p>
  </div>
  <div class="tool-shell">
    <div class="tool-field">
      <label for="tool-in">Input</label>
      <textarea id="tool-in" class="tool-textarea tool-textarea--tall" spellcheck="false"></textarea>
    </div>
    <div class="tool-actions">
      <button type="button" class="btn btn--primary btn--sm" id="tool-run">Chạy</button>
      <span class="tool-meta" id="tool-meta"></span>
    </div>
    <div class="tool-field">
      <label for="tool-out">Output</label>
      <textarea id="tool-out" class="tool-textarea tool-textarea--result" readonly spellcheck="false"></textarea>
    </div>
  </div>
</div>
`;

const js = `(function () {
  var inn = document.getElementById("tool-in");
  var out = document.getElementById("tool-out");
  var meta = document.getElementById("tool-meta");
  var btn = document.getElementById("tool-run");
  if (!inn || !out || !btn) return;

  btn.addEventListener("click", function () {
    out.value = inn.value;
    if (meta) meta.textContent = "OK";
  });
})();
`;

fs.mkdirSync(path.dirname(pagePath), { recursive: true });
fs.mkdirSync(path.dirname(jsPath), { recursive: true });
fs.writeFileSync(pagePath, page, "utf8");
fs.writeFileSync(jsPath, js, "utf8");

const tools = JSON.parse(fs.readFileSync(toolsJsonPath, "utf8"));
const category = tools.categories.find((c) => c.id === cat);
if (!category) {
  console.error("Unknown category:", cat);
  console.error(
    "Known:",
    tools.categories.map((c) => c.id).join(", ")
  );
  process.exit(1);
}
category.tools.push({
  slug,
  title,
  meta,
  icon,
  search: [slug, title, meta].filter(Boolean).join(" ").toLowerCase(),
});
fs.writeFileSync(toolsJsonPath, JSON.stringify(tools, null, 2) + "\n", "utf8");

console.log("Created:");
console.log(" -", path.relative(ROOT, pagePath));
console.log(" -", path.relative(ROOT, jsPath));
console.log(" - registry entry in src/data/tools.json →", cat);
console.log("Run: npm run build");
