const http = require("http");

function get(p, redirects = 0) {
  return new Promise((resolve) => {
    http
      .get({ hostname: "127.0.0.1", port: 3000, path: p }, (res) => {
        if (
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          redirects < 8
        ) {
          res.resume();
          let loc = res.headers.location;
          try {
            if (loc.startsWith("http")) loc = new URL(loc).pathname + (new URL(loc).search || "");
          } catch (_) {}
          return resolve(
            get(loc, redirects + 1).then((r) => ({
              ...r,
              chain: (p + " -> " + loc + (r.chain ? " -> " + r.chain : "")),
            }))
          );
        }
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({
            path: p,
            status: res.statusCode,
            title: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || "",
            is404page: /Page not found|404/i.test(body) && /nf__code|Not found/i.test(body),
          })
        );
      })
      .on("error", (e) => resolve({ path: p, err: e.message }));
  });
}

(async () => {
  const paths = [
    "/",
    "/tools",
    "/tools/",
    "/tools/base64.html",
    "/tools/base64",
    "/tools/fcm-push.html",
    "/tools/string-diff",
    "/calendar.html",
    "/calendar",
    "/css/style.css",
    "/nope-xyz-404",
    "/tools/missing-tool-xyz",
  ];
  for (const p of paths) {
    const r = await get(p);
    console.log(
      String(r.status || r.err).padEnd(4),
      p.padEnd(28),
      (r.title || "").slice(0, 40),
      r.chain || "",
      r.is404page ? "[custom 404]" : ""
    );
  }
})();
