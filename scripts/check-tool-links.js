const fs = require("fs");
const path = require("path");
const http = require("http");

const root = path.join(__dirname, "..");
const toolsDir = path.join(root, "tools");
const hub = fs.readFileSync(path.join(toolsDir, "index.html"), "utf8");
const hrefs = [...hub.matchAll(/href="([^"]+\.html)"/g)]
  .map((m) => m[1])
  .filter((h) => !h.startsWith("../") && !h.startsWith("http"));
const files = new Set(fs.readdirSync(toolsDir).filter((f) => f.endsWith(".html")));

console.log("=== files in tools/ ===");
console.log([...files].sort().join("\n"));

console.log("\n=== hub links ===");
const unique = [...new Set(hrefs)];
const missing = [];
for (const h of unique) {
  if (!files.has(h) && h !== "index.html") missing.push(h);
  else console.log("OK ", h);
}
console.log("\nMISSING files for hub links:", missing);

const orphan = [...files].filter((f) => f !== "index.html" && !unique.includes(f));
console.log("orphan files:", orphan);

// HTTP checks with redirect follow
function get(p, redirects = 0) {
  return new Promise((resolve) => {
    http
      .get({ hostname: "127.0.0.1", port: 3000, path: p }, (res) => {
        if (
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          redirects < 5
        ) {
          res.resume();
          let loc = res.headers.location;
          if (loc.startsWith("http")) {
            try {
              loc = new URL(loc).pathname;
            } catch (_) {}
          }
          return resolve(get(loc, redirects + 1).then((r) => ({ ...r, via: p + "->" + loc })));
        }
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({
            path: p,
            status: res.statusCode,
            len: body.length,
            title: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || "",
          })
        );
      })
      .on("error", (e) => resolve({ path: p, err: e.message }));
  });
}

(async () => {
  console.log("\n=== HTTP (follow redirects) ===");
  for (const h of unique) {
    const r = await get("/tools/" + h);
    console.log(r.status, r.path, r.title || r.err || "");
  }
  console.log(await get("/tools/this-does-not-exist-xyz.html"));
  console.log(await get("/does-not-exist"));
})();
