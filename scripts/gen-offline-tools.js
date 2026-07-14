/**
 * Generate offline (no external API) tool HTML pages from definitions.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const toolsDir = path.join(root, "tools");

function page({ slug, title, description, bodyHtml, script }) {
  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <script>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-W4K2NDNC");
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description.replace(/"/g, "&quot;")}" />
    <title>${title} · Tools</title>
    <link rel="icon" href="../favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../css/style.css" />
  </head>
  <body data-page="tools">
    <noscript
      ><iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-W4K2NDNC"
        height="0"
        width="0"
        style="display: none; visibility: hidden"
      ></iframe
    ></noscript>

    <header class="nav">
      <div class="nav__inner">
        <a class="nav__logo" href="../index.html">ngovanxuanduc<span>.com</span></a>
        <button class="nav__toggle" type="button" aria-label="Menu" aria-expanded="false">☰</button>
        <ul class="nav__links">
          <li><a href="../index.html" data-nav="home">Home</a></li>
          <li><a href="../calendar.html" data-nav="calendar">Lịch</a></li>
          <li><a href="index.html" data-nav="tools">Tools</a></li>
          <li><a href="../games/index.html" data-nav="games">Games</a></li>
          <li><a href="../articles/index.html" data-nav="articles">Articles</a></li>
        </ul>
      </div>
    </header>

    <main>
      <div class="container container--cal">
        <div class="game-header">
          <a class="game-header__back" href="index.html">← Tools</a>
          <h1>${title}</h1>
          <p>${description}</p>
        </div>
        <div class="tool-shell">
${bodyHtml}
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer__inner">
        <p>© <span id="y"></span> Ngo Van Xuan Duc</p>
        <ul class="footer__links">
          <li><a href="index.html">Tools</a></li>
        </ul>
      </div>
    </footer>

    <script>
      document.getElementById("y").textContent = new Date().getFullYear();
    </script>
    <script src="../js/main.js"></script>
    <script src="../js/tools/lib.js"></script>
    <script src="../js/tools/${script}"></script>
  </body>
</html>
`;
}

const io2 = (inId, outId, inPh, outPh) => `
          <div class="tool-row tool-row--2">
            <div class="tool-field">
              <label for="${inId}">Input</label>
              <textarea id="${inId}" class="tool-textarea tool-textarea--tall" placeholder="${inPh}" spellcheck="false"></textarea>
            </div>
            <div class="tool-field">
              <label for="${outId}">Output</label>
              <textarea id="${outId}" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false" placeholder="${outPh}"></textarea>
            </div>
          </div>`;

const tools = [
  {
    slug: "base64",
    title: "Base64",
    description: "Encode / decode Base64 hoàn toàn trên trình duyệt (UTF-8).",
    script: "base64.js",
    body: `
${io2("b64-in", "b64-out", "Text hoặc Base64…", "Kết quả…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="b64-enc">Encode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="b64-dec">Decode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="b64-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="b64-swap">Swap ↕</button>
            <button type="button" class="btn btn--ghost btn--sm" id="b64-clear">Xóa</button>
            <span class="tool-meta" id="b64-meta"></span>
          </div>`,
  },
  {
    slug: "url-codec",
    title: "URL encode / decode",
    description: "Percent-encoding (encodeURIComponent) — không cần API.",
    script: "url-codec.js",
    body: `
${io2("url-in", "url-out", "https://…?q=xin chào", "Kết quả…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="url-enc">Encode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="url-dec">Decode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="url-enc-full">encodeURI</button>
            <button type="button" class="btn btn--ghost btn--sm" id="url-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="url-clear">Xóa</button>
            <span class="tool-meta" id="url-meta"></span>
          </div>`,
  },
  {
    slug: "html-entities",
    title: "HTML entities",
    description: "Encode / decode HTML entities (&lt; &gt; &amp; …).",
    script: "html-entities.js",
    body: `
${io2("he-in", "he-out", "<div class=\"x\">…</div>", "Kết quả…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="he-enc">Encode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="he-dec">Decode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="he-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="he-clear">Xóa</button>
            <span class="tool-meta" id="he-meta"></span>
          </div>`,
  },
  {
    slug: "hash",
    title: "Hash",
    description: "SHA-1 / SHA-256 / SHA-384 / SHA-512 qua Web Crypto — offline.",
    script: "hash.js",
    body: `
          <div class="tool-field">
            <label for="hash-in">Input text</label>
            <textarea id="hash-in" class="tool-textarea" placeholder="Nhập text…" spellcheck="false"></textarea>
          </div>
          <div class="tool-actions">
            <label class="tool-check">Algo
              <select id="hash-algo" class="tool-select" style="width:auto;padding:0.35rem 0.5rem">
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-1">SHA-1</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </label>
            <button type="button" class="btn btn--primary btn--sm" id="hash-run">Hash</button>
            <button type="button" class="btn btn--ghost btn--sm" id="hash-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="hash-clear">Xóa</button>
            <span class="tool-meta" id="hash-meta"></span>
          </div>
          <div class="tool-field">
            <label for="hash-out">Hash (hex)</label>
            <textarea id="hash-out" class="tool-textarea tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>
          <div class="tool-field">
            <label for="hash-file">Hoặc hash file local</label>
            <input id="hash-file" class="tool-input" type="file" />
            <p class="tool-field__hint">File không upload đi đâu — chỉ đọc trong máy bạn.</p>
          </div>`,
  },
  {
    slug: "uuid",
    title: "UUID generator",
    description: "Sinh UUID v4 (crypto.getRandomValues) — hàng loạt, offline.",
    script: "uuid.js",
    body: `
          <div class="tool-actions">
            <label class="tool-check">Số lượng
              <input id="uuid-n" class="tool-input" type="number" min="1" max="10000" value="5" style="width:5rem;padding:0.35rem 0.5rem" />
            </label>
            <label class="tool-check">
              <input type="checkbox" id="uuid-upper" />
              UPPERCASE
            </label>
            <button type="button" class="btn btn--primary btn--sm" id="uuid-gen">Generate</button>
            <button type="button" class="btn btn--ghost btn--sm" id="uuid-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="uuid-clear">Xóa</button>
            <span class="tool-meta" id="uuid-meta"></span>
          </div>
          <div class="tool-field">
            <label for="uuid-out">Output</label>
            <textarea id="uuid-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "random-string",
    title: "Random string / password",
    description: "Sinh chuỗi ngẫu nhiên an toàn (crypto) — chọn charset & độ dài.",
    script: "random-string.js",
    body: `
          <div class="tool-actions">
            <label class="tool-check">Độ dài
              <input id="rs-len" class="tool-input" type="number" min="1" max="1024" value="16" style="width:5rem;padding:0.35rem 0.5rem" />
            </label>
            <label class="tool-check">Số lượng
              <input id="rs-n" class="tool-input" type="number" min="1" max="500" value="5" style="width:5rem;padding:0.35rem 0.5rem" />
            </label>
            <label class="tool-check"><input type="checkbox" id="rs-lower" checked /> a-z</label>
            <label class="tool-check"><input type="checkbox" id="rs-upper" checked /> A-Z</label>
            <label class="tool-check"><input type="checkbox" id="rs-digit" checked /> 0-9</label>
            <label class="tool-check"><input type="checkbox" id="rs-symbol" /> !@#…</label>
            <button type="button" class="btn btn--primary btn--sm" id="rs-gen">Generate</button>
            <button type="button" class="btn btn--ghost btn--sm" id="rs-copy">Copy</button>
            <span class="tool-meta" id="rs-meta"></span>
          </div>
          <div class="tool-field">
            <label for="rs-out">Output</label>
            <textarea id="rs-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "json-format",
    title: "JSON format / minify",
    description: "Pretty-print, minify, validate JSON — 100% local.",
    script: "json-format.js",
    body: `
${io2("jf-in", "jf-out", "{\"a\":1}", "Formatted…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="jf-pretty">Pretty</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jf-minify">Minify</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jf-validate">Validate</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jf-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jf-clear">Xóa</button>
            <label class="tool-check">Indent
              <select id="jf-indent" class="tool-select" style="width:auto;padding:0.35rem 0.5rem">
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">tab</option>
              </select>
            </label>
            <span class="tool-meta" id="jf-meta"></span>
          </div>`,
  },
  {
    slug: "json-csv",
    title: "JSON ↔ CSV",
    description: "Đổi mảng object JSON sang CSV và ngược lại — offline.",
    script: "json-csv.js",
    body: `
${io2("jc-in", "jc-out", "[{\"name\":\"A\",\"age\":1}]", "CSV hoặc JSON…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="jc-to-csv">JSON → CSV</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jc-to-json">CSV → JSON</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jc-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jc-clear">Xóa</button>
            <span class="tool-meta" id="jc-meta"></span>
          </div>`,
  },
  {
    slug: "query-json",
    title: "Query string ↔ JSON",
    description: "a=1&amp;b=hello ↔ object JSON.",
    script: "query-json.js",
    body: `
${io2("qj-in", "qj-out", "foo=1&bar=xin+chao", "JSON hoặc query…")}
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="qj-to-json">Query → JSON</button>
            <button type="button" class="btn btn--ghost btn--sm" id="qj-to-query">JSON → Query</button>
            <button type="button" class="btn btn--ghost btn--sm" id="qj-copy">Copy</button>
            <button type="button" class="btn btn--ghost btn--sm" id="qj-clear">Xóa</button>
            <span class="tool-meta" id="qj-meta"></span>
          </div>`,
  },
  {
    slug: "jwt-decode",
    title: "JWT decode",
    description: "Decode header & payload (Base64URL). Không verify chữ ký — offline.",
    script: "jwt-decode.js",
    body: `
          <div class="tool-field">
            <label for="jwt-in">JWT</label>
            <textarea id="jwt-in" class="tool-textarea" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…" spellcheck="false"></textarea>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="jwt-run">Decode</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jwt-copy">Copy payload</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jwt-clear">Xóa</button>
            <span class="tool-meta" id="jwt-meta"></span>
          </div>
          <div class="tool-row tool-row--2">
            <div class="tool-field">
              <label for="jwt-header">Header</label>
              <textarea id="jwt-header" class="tool-textarea tool-textarea--result" readonly spellcheck="false"></textarea>
            </div>
            <div class="tool-field">
              <label for="jwt-payload">Payload</label>
              <textarea id="jwt-payload" class="tool-textarea tool-textarea--result" readonly spellcheck="false"></textarea>
            </div>
          </div>`,
  },
  {
    slug: "timestamp",
    title: "Timestamp convert",
    description: "Unix seconds/ms ↔ datetime local & UTC — không API.",
    script: "timestamp.js",
    body: `
          <div class="convert-grid">
            <div class="tool-field">
              <label for="ts-unix">Unix (seconds)</label>
              <input id="ts-unix" class="tool-input" type="text" inputmode="numeric" placeholder="1700000000" autocomplete="off" />
            </div>
            <div class="tool-field">
              <label for="ts-ms">Unix (milliseconds)</label>
              <input id="ts-ms" class="tool-input" type="text" inputmode="numeric" placeholder="1700000000000" autocomplete="off" />
            </div>
            <div class="tool-field">
              <label for="ts-iso">ISO / datetime</label>
              <input id="ts-iso" class="tool-input" type="text" placeholder="2024-01-01T00:00:00.000Z" autocomplete="off" />
            </div>
            <div class="tool-field">
              <label for="ts-local">Local (máy bạn)</label>
              <input id="ts-local" class="tool-input" type="text" readonly />
            </div>
            <div class="tool-field">
              <label for="ts-utc">UTC string</label>
              <input id="ts-utc" class="tool-input" type="text" readonly />
            </div>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="ts-now">Now</button>
            <button type="button" class="btn btn--ghost btn--sm" id="ts-clear">Xóa</button>
            <span class="tool-meta" id="ts-meta"></span>
          </div>`,
  },
  {
    slug: "number-format",
    title: "Number format",
    description: "Format số: grouping, decimals, percent, scientific — Intl local.",
    script: "number-format.js",
    body: `
          <div class="tool-field">
            <label for="nf-in">Number</label>
            <input id="nf-in" class="tool-input" type="text" inputmode="decimal" placeholder="1234567.89" autocomplete="off" />
          </div>
          <div class="tool-actions">
            <label class="tool-check">Decimals
              <input id="nf-dec" class="tool-input" type="number" min="0" max="12" value="2" style="width:4rem;padding:0.35rem 0.5rem" />
            </label>
            <button type="button" class="btn btn--primary btn--sm" id="nf-run">Format</button>
            <button type="button" class="btn btn--ghost btn--sm" id="nf-copy">Copy</button>
            <span class="tool-meta" id="nf-meta"></span>
          </div>
          <div class="convert-grid" id="nf-out"></div>`,
  },
  {
    slug: "byte-size",
    title: "Byte size convert",
    description: "B / KB / MB / GB / TB (1024 hoặc 1000).",
    script: "byte-size.js",
    body: `
          <div class="tool-actions">
            <label class="tool-check">
              <input type="radio" name="bs-base" value="1024" checked /> Binary (1024)
            </label>
            <label class="tool-check">
              <input type="radio" name="bs-base" value="1000" /> Decimal (1000)
            </label>
            <span class="tool-meta" id="bs-meta"></span>
          </div>
          <div class="convert-grid">
            <div class="tool-field"><label for="bs-b">Bytes</label><input id="bs-b" class="tool-input" type="text" inputmode="decimal" autocomplete="off" /></div>
            <div class="tool-field"><label for="bs-kb">KB</label><input id="bs-kb" class="tool-input" type="text" inputmode="decimal" autocomplete="off" /></div>
            <div class="tool-field"><label for="bs-mb">MB</label><input id="bs-mb" class="tool-input" type="text" inputmode="decimal" autocomplete="off" /></div>
            <div class="tool-field"><label for="bs-gb">GB</label><input id="bs-gb" class="tool-input" type="text" inputmode="decimal" autocomplete="off" /></div>
            <div class="tool-field"><label for="bs-tb">TB</label><input id="bs-tb" class="tool-input" type="text" inputmode="decimal" autocomplete="off" /></div>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--ghost btn--sm" id="bs-clear">Xóa</button>
          </div>`,
  },
  {
    slug: "percentage",
    title: "Percentage calculator",
    description: "X% của Y, X là bao nhiêu % của Y, tăng/giảm % — offline.",
    script: "percentage.js",
    body: `
          <div class="convert-grid">
            <div class="tool-field">
              <label><span id="pct-l1">X</span></label>
              <input id="pct-a" class="tool-input" type="text" inputmode="decimal" placeholder="25" autocomplete="off" />
            </div>
            <div class="tool-field">
              <label><span id="pct-l2">Y</span></label>
              <input id="pct-b" class="tool-input" type="text" inputmode="decimal" placeholder="200" autocomplete="off" />
            </div>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" data-pct="of">X% của Y</button>
            <button type="button" class="btn btn--ghost btn--sm" data-pct="is">X là % của Y</button>
            <button type="button" class="btn btn--ghost btn--sm" data-pct="change">% đổi từ X → Y</button>
            <span class="tool-meta" id="pct-meta"></span>
          </div>
          <div class="ip-card" style="margin-top:0.5rem">
            <div class="ip-card__label">Kết quả</div>
            <div class="ip-card__value" id="pct-out">—</div>
          </div>`,
  },
  {
    slug: "random-number",
    title: "Random number",
    description: "Sinh số ngẫu nhiên trong khoảng (crypto), hàng loạt.",
    script: "random-number.js",
    body: `
          <div class="tool-actions">
            <label class="tool-check">Min <input id="rn-min" class="tool-input" type="number" value="1" style="width:5rem;padding:0.35rem 0.5rem" /></label>
            <label class="tool-check">Max <input id="rn-max" class="tool-input" type="number" value="100" style="width:5rem;padding:0.35rem 0.5rem" /></label>
            <label class="tool-check">Count <input id="rn-n" class="tool-input" type="number" min="1" max="10000" value="10" style="width:5rem;padding:0.35rem 0.5rem" /></label>
            <label class="tool-check"><input type="checkbox" id="rn-unique" /> Unique</label>
            <button type="button" class="btn btn--primary btn--sm" id="rn-gen">Generate</button>
            <button type="button" class="btn btn--ghost btn--sm" id="rn-copy">Copy</button>
            <span class="tool-meta" id="rn-meta"></span>
          </div>
          <div class="tool-field">
            <label for="rn-out">Output</label>
            <textarea id="rn-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "text-stats",
    title: "Text stats",
    description: "Đếm ký tự, từ, dòng, byte UTF-8 — realtime, offline.",
    script: "text-stats.js",
    body: `
          <div class="tool-field">
            <label for="tx-in">Text</label>
            <textarea id="tx-in" class="tool-textarea tool-textarea--tall" placeholder="Dán text…" spellcheck="false"></textarea>
          </div>
          <div class="convert-grid" id="tx-stats"></div>`,
  },
  {
    slug: "join-split",
    title: "Join / Split lines",
    description: "Gộp dòng bằng delimiter hoặc tách chuỗi thành nhiều dòng.",
    script: "join-split.js",
    body: `
${io2("js-in", "js-out", "a\\nb\\nc", "Kết quả…")}
          <div class="tool-actions">
            <label class="tool-check">Delimiter
              <input id="js-delim" class="tool-input" type="text" value="," style="width:6rem;padding:0.35rem 0.5rem" />
            </label>
            <button type="button" class="btn btn--primary btn--sm" id="js-join">Join lines</button>
            <button type="button" class="btn btn--ghost btn--sm" id="js-split">Split → lines</button>
            <button type="button" class="btn btn--ghost btn--sm" id="js-copy">Copy</button>
            <span class="tool-meta" id="js-meta"></span>
          </div>`,
  },
  {
    slug: "find-replace",
    title: "Find & replace",
    description: "Tìm/thay text hoặc regex (capture $1…) — chạy local.",
    script: "find-replace.js",
    body: `
          <div class="tool-field">
            <label for="fr-in">Input</label>
            <textarea id="fr-in" class="tool-textarea tool-textarea--tall" spellcheck="false"></textarea>
          </div>
          <div class="tool-row tool-row--2">
            <div class="tool-field">
              <label for="fr-find">Find</label>
              <input id="fr-find" class="tool-input" type="text" placeholder="pattern" autocomplete="off" />
            </div>
            <div class="tool-field">
              <label for="fr-repl">Replace</label>
              <input id="fr-repl" class="tool-input" type="text" placeholder="replacement" autocomplete="off" />
            </div>
          </div>
          <div class="tool-actions">
            <label class="tool-check"><input type="checkbox" id="fr-regex" /> Regex</label>
            <label class="tool-check"><input type="checkbox" id="fr-i" /> i (ignore case)</label>
            <label class="tool-check"><input type="checkbox" id="fr-m" /> m (multiline)</label>
            <label class="tool-check"><input type="checkbox" id="fr-s" /> s (dotAll)</label>
            <button type="button" class="btn btn--primary btn--sm" id="fr-run">Replace all</button>
            <button type="button" class="btn btn--ghost btn--sm" id="fr-copy">Copy</button>
            <span class="tool-meta" id="fr-meta"></span>
          </div>
          <div class="tool-field">
            <label for="fr-out">Output</label>
            <textarea id="fr-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "prefix-suffix",
    title: "Prefix / suffix lines",
    description: "Thêm hoặc gỡ chuỗi đầu/cuối mỗi dòng.",
    script: "prefix-suffix.js",
    body: `
${io2("ps-in", "ps-out", "one\\ntwo\\nthree", "Kết quả…")}
          <div class="tool-actions">
            <label class="tool-check">Prefix <input id="ps-pre" class="tool-input" type="text" value="" style="width:8rem;padding:0.35rem 0.5rem" placeholder="• " /></label>
            <label class="tool-check">Suffix <input id="ps-suf" class="tool-input" type="text" value="" style="width:8rem;padding:0.35rem 0.5rem" placeholder=";" /></label>
            <button type="button" class="btn btn--primary btn--sm" id="ps-add">Thêm</button>
            <button type="button" class="btn btn--ghost btn--sm" id="ps-strip">Gỡ nếu khớp</button>
            <button type="button" class="btn btn--ghost btn--sm" id="ps-copy">Copy</button>
            <span class="tool-meta" id="ps-meta"></span>
          </div>`,
  },
  {
    slug: "lorem",
    title: "Lorem ipsum",
    description: "Sinh đoạn lorem giả lập — số paragraph / sentence tùy chọn.",
    script: "lorem.js",
    body: `
          <div class="tool-actions">
            <label class="tool-check">Paragraphs
              <input id="lo-p" class="tool-input" type="number" min="1" max="50" value="3" style="width:4rem;padding:0.35rem 0.5rem" />
            </label>
            <label class="tool-check">Sentences / p
              <input id="lo-s" class="tool-input" type="number" min="1" max="20" value="4" style="width:4rem;padding:0.35rem 0.5rem" />
            </label>
            <button type="button" class="btn btn--primary btn--sm" id="lo-gen">Generate</button>
            <button type="button" class="btn btn--ghost btn--sm" id="lo-copy">Copy</button>
          </div>
          <div class="tool-field">
            <label for="lo-out">Output</label>
            <textarea id="lo-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "cron-explain",
    title: "Cron explain",
    description: "Giải thích cron 5-field (min hour dom mon dow) — rule local, không API.",
    script: "cron-explain.js",
    body: `
          <div class="tool-field">
            <label for="cron-in">Cron expression</label>
            <input id="cron-in" class="tool-input" type="text" value="*/5 * * * *" spellcheck="false" autocomplete="off" />
            <p class="tool-field__hint">Format: minute hour day-of-month month day-of-week</p>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="cron-run">Explain</button>
            <span class="tool-meta" id="cron-meta"></span>
          </div>
          <div class="ip-card" style="text-align:left">
            <pre id="cron-out" style="margin:0;white-space:pre-wrap;font-family:var(--mono);font-size:0.85rem;color:var(--text-muted);line-height:1.6"></pre>
          </div>`,
  },
  {
    slug: "color-convert",
    title: "Color convert",
    description: "HEX ↔ RGB ↔ HSL + preview — offline.",
    script: "color-convert.js",
    body: `
          <div class="tool-actions" style="align-items:stretch">
            <div style="width:64px;height:64px;border-radius:12px;border:1px solid var(--border);background:#a78bfa" id="co-swatch"></div>
          </div>
          <div class="convert-grid">
            <div class="tool-field"><label for="co-hex">HEX</label><input id="co-hex" class="tool-input" type="text" value="#a78bfa" autocomplete="off" /></div>
            <div class="tool-field"><label for="co-rgb">RGB</label><input id="co-rgb" class="tool-input" type="text" value="167, 139, 250" autocomplete="off" /></div>
            <div class="tool-field"><label for="co-hsl">HSL</label><input id="co-hsl" class="tool-input" type="text" value="255, 91%, 76%" autocomplete="off" /></div>
          </div>
          <div class="tool-actions">
            <input id="co-picker" type="color" value="#a78bfa" style="width:48px;height:36px;border:none;background:transparent;cursor:pointer" />
            <span class="tool-meta" id="co-meta"></span>
          </div>`,
  },
  {
    slug: "json-diff",
    title: "JSON diff",
    description: "So 2 JSON (key path) — thêm/xóa/đổi giá trị. Offline.",
    script: "json-diff.js",
    body: `
          <div class="tool-row tool-row--2">
            <div class="tool-field">
              <label for="jd-a">JSON A</label>
              <textarea id="jd-a" class="tool-textarea tool-textarea--tall" spellcheck="false">{"a":1,"b":{"c":2}}</textarea>
            </div>
            <div class="tool-field">
              <label for="jd-b">JSON B</label>
              <textarea id="jd-b" class="tool-textarea tool-textarea--tall" spellcheck="false">{"a":1,"b":{"c":3},"d":true}</textarea>
            </div>
          </div>
          <div class="tool-actions">
            <button type="button" class="btn btn--primary btn--sm" id="jd-run">Diff</button>
            <button type="button" class="btn btn--ghost btn--sm" id="jd-copy">Copy</button>
            <span class="tool-meta" id="jd-meta"></span>
          </div>
          <div class="tool-field">
            <label for="jd-out">Diff</label>
            <textarea id="jd-out" class="tool-textarea tool-textarea--tall tool-textarea--result" readonly spellcheck="false"></textarea>
          </div>`,
  },
  {
    slug: "user-agent",
    title: "User-Agent viewer",
    description: "Xem User-Agent và vài tín hiệu trình duyệt — navigator only.",
    script: "user-agent.js",
    body: `
          <div class="ip-card" style="text-align:left">
            <div class="ip-card__label">User-Agent</div>
            <div class="ip-card__value" id="ua-ua" style="font-size:0.95rem;text-align:left;word-break:break-all"></div>
            <dl class="ip-details" id="ua-details"></dl>
          </div>`,
  },
];

for (const t of tools) {
  const html = page({
    slug: t.slug,
    title: t.title,
    description: t.description,
    bodyHtml: t.body,
    script: t.script,
  });
  fs.writeFileSync(path.join(toolsDir, t.slug + ".html"), html, "utf8");
  console.log("wrote", t.slug + ".html");
}

// export list for index
fs.writeFileSync(
  path.join(__dirname, "offline-tools-manifest.json"),
  JSON.stringify(
    tools.map((t) => ({
      slug: t.slug,
      title: t.title,
      description: t.description,
    })),
    null,
    2
  ),
  "utf8"
);
console.log("done", tools.length);
