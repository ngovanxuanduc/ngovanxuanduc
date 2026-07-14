/**
 * YAML ↔ JSON — practical DevOps subset (offline, no deps).
 * Supports: maps, sequences, scalars, quotes, flow {} / [], | and > blocks.
 */
(function () {
  "use strict";

  var inn = document.getElementById("yj-in");
  var out = document.getElementById("yj-out");
  var meta = document.getElementById("yj-meta");
  var indentEl = document.getElementById("yj-indent");
  if (!inn || !out) return;

  function setMeta(msg, ok) {
    if (!meta) return;
    meta.textContent = msg || "";
    meta.style.color = ok === false ? "var(--danger)" : "var(--text-dim)";
  }

  function indentSize() {
    return Math.min(8, Math.max(2, parseInt(indentEl && indentEl.value, 10) || 2));
  }

  /* ===== Scalar / flow ===== */

  function parseScalar(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s || s === "~" || /^null$/i.test(s)) return null;
    if (/^true$/i.test(s)) return true;
    if (/^false$/i.test(s)) return false;
    if (
      (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') ||
      (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")
    ) {
      var q = s.charAt(0);
      var inner = s.slice(1, -1);
      if (q === '"') {
        return inner
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
      return inner.replace(/''/g, "'");
    }
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
      var n = Number(s);
      if (Number.isFinite(n)) return n;
    }
    return s;
  }

  function parseFlow(input) {
    var str = String(input || "").trim();
    var i = 0;

    function skip() {
      while (i < str.length && /\s/.test(str.charAt(i))) i++;
    }

    function parseValue() {
      skip();
      var c = str.charAt(i);
      if (c === "{") return parseObj();
      if (c === "[") return parseArr();
      var start = i;
      var inQ = null;
      while (i < str.length) {
        var ch = str.charAt(i);
        if (inQ) {
          if (ch === "\\" && inQ === '"') {
            i += 2;
            continue;
          }
          if (ch === inQ) inQ = null;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") {
          inQ = ch;
          i++;
          continue;
        }
        if (ch === "," || ch === "}" || ch === "]") break;
        i++;
      }
      return parseScalar(str.slice(start, i));
    }

    function parseArr() {
      i++;
      var arr = [];
      skip();
      if (str.charAt(i) === "]") {
        i++;
        return arr;
      }
      while (i < str.length) {
        arr.push(parseValue());
        skip();
        if (str.charAt(i) === ",") {
          i++;
          skip();
          continue;
        }
        if (str.charAt(i) === "]") {
          i++;
          return arr;
        }
        throw new Error("Flow [] lỗi gần: " + str.slice(Math.max(0, i - 5), i + 15));
      }
      throw new Error("Flow [] chưa đóng");
    }

    function parseObj() {
      i++;
      var obj = {};
      skip();
      if (str.charAt(i) === "}") {
        i++;
        return obj;
      }
      while (i < str.length) {
        skip();
        var ks = i;
        var inQ = null;
        while (i < str.length) {
          var ch = str.charAt(i);
          if (inQ) {
            if (ch === inQ) inQ = null;
            i++;
            continue;
          }
          if (ch === '"' || ch === "'") {
            inQ = ch;
            i++;
            continue;
          }
          if (ch === ":") break;
          i++;
        }
        var key = parseScalar(str.slice(ks, i).trim());
        if (typeof key !== "string") key = String(str.slice(ks, i).trim());
        skip();
        if (str.charAt(i) !== ":") throw new Error("Flow {} thiếu ':'");
        i++;
        obj[key] = parseValue();
        skip();
        if (str.charAt(i) === ",") {
          i++;
          continue;
        }
        if (str.charAt(i) === "}") {
          i++;
          return obj;
        }
        throw new Error("Flow {} lỗi gần: " + str.slice(Math.max(0, i - 5), i + 15));
      }
      throw new Error("Flow {} chưa đóng");
    }

    skip();
    var v = parseValue();
    skip();
    if (i < str.length) throw new Error("Flow thừa ký tự");
    return v;
  }

  /* ===== Block YAML ===== */

  function stripInlineComment(line) {
    var inQ = null;
    for (var i = 0; i < line.length; i++) {
      var c = line.charAt(i);
      if (inQ) {
        if (c === "\\" && inQ === '"') {
          i++;
          continue;
        }
        if (c === inQ) inQ = null;
        continue;
      }
      if (c === '"' || c === "'") {
        inQ = c;
        continue;
      }
      if (c === "#" && (i === 0 || /\s/.test(line.charAt(i - 1)))) {
        return line.slice(0, i).replace(/\s+$/, "");
      }
    }
    return line;
  }

  function parseYaml(text) {
    var raw = String(text || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    if (raw.indexOf("---") === 0) raw = raw.replace(/^---\s*\n?/, "");
    var end = raw.search(/\n---\s*(\n|$)/);
    if (end !== -1) raw = raw.slice(0, end);

    var src = raw.split("\n");
    var rows = [];
    for (var r = 0; r < src.length; r++) {
      var cleaned = stripInlineComment(src[r]);
      if (cleaned.trim() === "") continue;
      var m = cleaned.match(/^(\s*)(.*)$/);
      rows.push({ ind: m[1].length, text: m[2], line: r + 1 });
    }

    var idx = 0;

    function peek() {
      return idx < rows.length ? rows[idx] : null;
    }

    function parseNode(minInd) {
      var row = peek();
      if (!row || row.ind < minInd) return null;
      var t = row.text;
      if (t.charAt(0) === "{" || t.charAt(0) === "[") {
        idx++;
        return parseFlow(t);
      }
      if (t.charAt(0) === "-" && (t.length === 1 || t.charAt(1) === " ")) {
        return parseList(row.ind);
      }
      return parseMap(row.ind);
    }

    function parseList(baseInd) {
      var arr = [];
      while (true) {
        var row = peek();
        if (!row || row.ind < baseInd) break;
        if (row.ind > baseInd) throw new Error("Indent list sai (dòng " + row.line + ")");
        if (!(row.text.charAt(0) === "-" && (row.text.length === 1 || row.text.charAt(1) === " ")))
          break;
        idx++;
        var rest = row.text.slice(1).replace(/^\s+/, "");
        if (rest === "") {
          arr.push(parseNode(baseInd + 1));
        } else if (rest.charAt(0) === "{" || rest.charAt(0) === "[") {
          arr.push(parseFlow(rest));
        } else if (looksLikeKey(rest)) {
          // compact: "- key: value" then nested keys at baseInd+2
          arr.push(parseMapFromInline(rest, baseInd + 2));
        } else {
          arr.push(parseScalar(rest));
        }
      }
      return arr;
    }

    function looksLikeKey(s) {
      // key: or key: value (not URL-ish without space after colon only handled simply)
      var inQ = null;
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (inQ) {
          if (c === inQ) inQ = null;
          continue;
        }
        if (c === '"' || c === "'") {
          inQ = c;
          continue;
        }
        if (c === ":") {
          return i > 0 && (i === s.length - 1 || s.charAt(i + 1) === " ");
        }
      }
      return false;
    }

    function splitKeyVal(s) {
      var inQ = null;
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (inQ) {
          if (c === inQ) inQ = null;
          continue;
        }
        if (c === '"' || c === "'") {
          inQ = c;
          continue;
        }
        if (c === ":") {
          return {
            key: s.slice(0, i).trim(),
            val: s.slice(i + 1).replace(/^\s+/, ""),
          };
        }
      }
      return null;
    }

    function parseMapFromInline(firstLine, childInd) {
      var obj = {};
      var kv = splitKeyVal(firstLine);
      if (!kv) return parseScalar(firstLine);
      assignKV(obj, kv.key, kv.val, childInd - 1);
      // more keys at childInd
      while (true) {
        var row = peek();
        if (!row || row.ind < childInd) break;
        if (row.ind > childInd) throw new Error("Indent map sai (dòng " + row.line + ")");
        if (row.text.charAt(0) === "-") break;
        if (!looksLikeKey(row.text)) break;
        idx++;
        var kv2 = splitKeyVal(row.text);
        if (!kv2) continue;
        assignKV(obj, kv2.key, kv2.val, childInd);
      }
      return obj;
    }

    function assignKV(obj, keyRaw, val, parentInd) {
      var key = parseScalar(keyRaw);
      if (typeof key !== "string") key = String(keyRaw);
      if (val === "" || val === "|" || val === ">") {
        if (val === "|" || val === ">") {
          obj[key] = parseBlockScalar(parentInd, val === ">");
        } else {
          var next = peek();
          if (!next || next.ind <= parentInd) obj[key] = null;
          else obj[key] = parseNode(parentInd + 1);
        }
      } else if (val.charAt(0) === "{" || val.charAt(0) === "[") {
        obj[key] = parseFlow(val);
      } else {
        obj[key] = parseScalar(val);
      }
    }

    function parseMap(baseInd) {
      var obj = {};
      var count = 0;
      while (true) {
        var row = peek();
        if (!row || row.ind < baseInd) break;
        if (row.ind > baseInd) throw new Error("Indent map sai (dòng " + row.line + ")");
        if (row.text.charAt(0) === "-" && (row.text.length === 1 || row.text.charAt(1) === " ")) {
          if (!count) return parseList(baseInd);
          break;
        }
        if (row.text.charAt(0) === "{" || row.text.charAt(0) === "[") {
          if (!count) {
            idx++;
            return parseFlow(row.text);
          }
          break;
        }
        if (!looksLikeKey(row.text)) {
          throw new Error("Không parse được dòng " + row.line + ": " + row.text);
        }
        idx++;
        count++;
        var kv = splitKeyVal(row.text);
        assignKV(obj, kv.key, kv.val, baseInd);
      }
      return obj;
    }

    function parseBlockScalar(baseInd, fold) {
      var chunks = [];
      var contentInd = null;
      while (true) {
        var row = peek();
        if (!row) break;
        // blank source lines already stripped — empty content via missing
        if (row.ind <= baseInd) break;
        if (contentInd == null) contentInd = row.ind;
        // original line content: reconstruct from rows — we only stored trim-right via strip
        // use text with indent relative
        var full = src[row.line - 1];
        // keep raw line without comment strip for block? use rows text padded
        chunks.push(full.slice(contentInd));
        idx++;
      }
      if (fold) {
        return chunks
          .join("\n")
          .replace(/([^\n])\n([^\n])/g, "$1 $2")
          .replace(/\n\n/g, "\n");
      }
      return chunks.join("\n");
    }

    if (!rows.length) return null;
    return parseNode(rows[0].ind);
  }

  /* ===== JSON → YAML ===== */

  function needsQuote(s) {
    if (s === "") return true;
    if (/^[:\-?\[\]{},#&*!|>'"%@`>]/.test(s)) return true;
    if (/[\n\r#:]/.test(s)) return true;
    if (/^(true|false|null)$/i.test(s) || s === "~") return true;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return true;
    if (/\s/.test(s)) return true;
    return false;
  }

  function quoteStr(s) {
    return (
      '"' +
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t") +
      '"'
    );
  }

  function toYaml(value, spaces) {
    spaces = spaces || 2;

    function dump(val, level) {
      var pad = new Array(level * spaces + 1).join(" ");
      var pad1 = new Array((level + 1) * spaces + 1).join(" ");

      if (val === null || val === undefined) return "null";
      if (typeof val === "boolean") return val ? "true" : "false";
      if (typeof val === "number") return Number.isFinite(val) ? String(val) : "null";
      if (typeof val === "string") {
        if (val.indexOf("\n") !== -1) {
          var lines = val.split("\n");
          var o = "|\n";
          for (var i = 0; i < lines.length; i++) o += pad1 + lines[i] + "\n";
          return o.replace(/\n$/, "");
        }
        return needsQuote(val) ? quoteStr(val) : val;
      }
      if (Array.isArray(val)) {
        if (!val.length) return "[]";
        return val
          .map(function (item) {
            if (item !== null && typeof item === "object") {
              var body = dump(item, level + 1);
              var blines = body.split("\n");
              if (Array.isArray(item)) {
                return pad + "-\n" + body;
              }
              // object under list
              return (
                pad +
                "- " +
                blines[0].replace(/^\s+/, "") +
                (blines.length > 1
                  ? "\n" +
                    blines
                      .slice(1)
                      .map(function (ln) {
                        // body already indented at level+1; keep as-is
                        return ln;
                      })
                      .join("\n")
                  : "")
              );
            }
            return pad + "- " + dump(item, 0);
          })
          .join("\n");
      }
      if (typeof val === "object") {
        var keys = Object.keys(val);
        if (!keys.length) return "{}";
        return keys
          .map(function (k) {
            var keyOut = needsQuote(k) ? quoteStr(k) : k;
            var v = val[k];
            if (v !== null && typeof v === "object") {
              var nested = dump(v, level + 1);
              if (nested === "[]" || nested === "{}") return pad + keyOut + ": " + nested;
              return pad + keyOut + ":\n" + nested;
            }
            return pad + keyOut + ": " + dump(v, 0);
          })
          .join("\n");
      }
      return quoteStr(String(val));
    }

    return dump(value, 0);
  }

  function yamlToJson() {
    try {
      var data = parseYaml(inn.value);
      out.value = JSON.stringify(data, null, indentSize());
      setMeta("YAML → JSON OK", true);
    } catch (e) {
      setMeta("Lỗi YAML: " + (e && e.message ? e.message : e), false);
    }
  }

  function jsonToYaml() {
    try {
      var data = JSON.parse(inn.value || "null");
      out.value = toYaml(data, indentSize());
      setMeta("JSON → YAML OK", true);
    } catch (e) {
      setMeta("Lỗi JSON: " + (e && e.message ? e.message : e), false);
    }
  }

  var btnYj = document.getElementById("yj-to-json");
  var btnJy = document.getElementById("yj-to-yaml");
  var btnSwap = document.getElementById("yj-swap");
  var btnCopy = document.getElementById("yj-copy");
  var btnClear = document.getElementById("yj-clear");

  if (btnYj) btnYj.addEventListener("click", yamlToJson);
  if (btnJy) btnJy.addEventListener("click", jsonToYaml);
  if (btnSwap)
    btnSwap.addEventListener("click", function () {
      var t = inn.value;
      inn.value = out.value;
      out.value = t;
      setMeta("Đã đổi chiều");
    });
  if (btnCopy) {
    btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      if (window.ToolLib) ToolLib.copyText(out.value || "", btnCopy, { onOk: function () { setMeta("Đã copy", true); } });
      else if (navigator.clipboard) navigator.clipboard.writeText(out.value || "");
    });
  }
  if (btnClear)
    btnClear.addEventListener("click", function () {
      inn.value = out.value = "";
      setMeta("");
    });
})();
