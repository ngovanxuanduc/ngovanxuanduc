const fs = require("fs");
const path = require("path");

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "scripts")
      continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.name.endsWith(".html")) files.push(p);
  }
  return files;
}

const root = path.join(__dirname, "..");
const files = walk(root);

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("nav__links")) continue;
  if (html.includes('data-nav="tools"')) {
    console.log("skip:", path.relative(root, file));
    continue;
  }

  const rel = path.relative(root, file).replace(/\\/g, "/");
  let toolsHref;
  let re;

  if (rel.startsWith("games/") || rel.startsWith("articles/")) {
    toolsHref = "../tools/index.html";
    re =
      /(<li><a href="\.\.\/calendar\.html" data-nav="calendar">[^<]*<\/a><\/li>\s*)/;
  } else if (rel.startsWith("tools/")) {
    continue;
  } else {
    toolsHref = "tools/index.html";
    re = /(<li><a href="calendar\.html" data-nav="calendar">[^<]*<\/a><\/li>\s*)/;
  }

  if (!re.test(html)) {
    console.log("NO MATCH:", rel);
    continue;
  }

  html = html.replace(
    re,
    `$1<li><a href="${toolsHref}" data-nav="tools">Tools</a></li>\n          `
  );
  fs.writeFileSync(file, html, "utf8");
  console.log("updated:", rel);
}
