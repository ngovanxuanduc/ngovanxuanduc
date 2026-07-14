const fs = require("fs");
const path = require("path");

function fixFile(p, replacers) {
  let h = fs.readFileSync(p, "utf8");
  const o = h;
  for (const [a, b] of replacers) h = h.split(a).join(b);
  if (h !== o) {
    fs.writeFileSync(p, h, "utf8");
    console.log("fixed", p);
  }
}

const rootRep = [
  ['href="favicon.ico"', 'href="/favicon.ico"'],
  ['href="css/style.css"', 'href="/css/style.css"'],
  ['src="js/', 'src="/js/'],
  ['href="index.html"', 'href="/"'],
  ['href="calendar.html"', 'href="/calendar.html"'],
  ['href="tools/index.html"', 'href="/tools/"'],
  ['href="games/index.html"', 'href="/games/"'],
  ['href="articles/index.html"', 'href="/articles/"'],
  ['href="tools/', 'href="/tools/'],
  ['href="games/', 'href="/games/'],
  ['href="articles/', 'href="/articles/'],
];

for (const f of ["index.html", "calendar.html", "404.html"]) {
  if (fs.existsSync(f)) fixFile(f, rootRep);
}

const subRep = [
  ['href="../favicon.ico"', 'href="/favicon.ico"'],
  ['href="../css/style.css"', 'href="/css/style.css"'],
  ['src="../js/', 'src="/js/'],
];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) fixFile(p, subRep);
  }
}
walk("games");
walk("articles");
walk("tools");

console.log("done");
