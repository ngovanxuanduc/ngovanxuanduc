/**
 * Normalize remaining relative in-section links to root-absolute paths
 * so GitHub Pages + Cloudflare Pages work with custom domain at site root.
 */
const fs = require("fs");
const path = require("path");

function fix(file, pairs) {
  let h = fs.readFileSync(file, "utf8");
  const o = h;
  for (const [a, b] of pairs) h = h.split(a).join(b);
  if (h !== o) {
    fs.writeFileSync(file, h, "utf8");
    console.log("fixed", file);
  }
}

// games hub + pages
fix("games/index.html", [
  ['href="tic-tac-toe.html"', 'href="/games/tic-tac-toe.html"'],
  ['href="memory.html"', 'href="/games/memory.html"'],
  ['href="snake.html"', 'href="/games/snake.html"'],
  ['href="index.html"', 'href="/games/"'],
]);

for (const f of ["tic-tac-toe.html", "memory.html", "snake.html"]) {
  fix(path.join("games", f), [
    ['href="index.html"', 'href="/games/"'],
    ['class="game-header__back" href="/games/"', 'class="game-header__back" href="/games/"'],
  ]);
  // back link might still be index.html from earlier
  let html = fs.readFileSync(path.join("games", f), "utf8");
  html = html.replace(
    /class="game-header__back" href="index\.html"/g,
    'class="game-header__back" href="/games/"'
  );
  html = html.replace(/href="index\.html"/g, 'href="/games/"');
  fs.writeFileSync(path.join("games", f), html, "utf8");
  console.log("normalized", f);
}

// articles
fix("articles/index.html", [
  ['href="chao-mung.html"', 'href="/articles/chao-mung.html"'],
  ['href="mini-games.html"', 'href="/articles/mini-games.html"'],
  ['href="dark-minimal.html"', 'href="/articles/dark-minimal.html"'],
]);

for (const f of [
  "chao-mung.html",
  "mini-games.html",
  "dark-minimal.html",
]) {
  let html = fs.readFileSync(path.join("articles", f), "utf8");
  html = html
    .replace(/href="index\.html"/g, 'href="/articles/"')
    .replace(/href="\.\.\/games\/tic-tac-toe\.html"/g, 'href="/games/tic-tac-toe.html"')
    .replace(/href="\.\.\/games\/memory\.html"/g, 'href="/games/memory.html"')
    .replace(/href="\.\.\/games\/snake\.html"/g, 'href="/games/snake.html"')
    .replace(/href="\.\.\/games\/index\.html"/g, 'href="/games/"')
    .replace(/href="\.\.\/index\.html"/g, 'href="/"');
  fs.writeFileSync(path.join("articles", f), html, "utf8");
  console.log("normalized articles", f);
}

// Prefer /tools over /tools/ only if needed — keep /tools/ for directory index
// GitHub Pages serves both tools/ and tools/index.html

console.log("done");
