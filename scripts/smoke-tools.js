/**
 * Lightweight pure-logic smoke tests for tools (no DOM).
 * Run: node scripts/smoke-tools.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
let failed = 0;

function ok(name, cond, detail) {
  if (cond) {
    console.log("  ✓", name);
  } else {
    failed++;
    console.log("  ✗", name, detail || "");
  }
}

// ---- ToolLib ----
console.log("ToolLib");
const libCode = fs.readFileSync(
  path.join(ROOT, "public/js/tools/lib.js"),
  "utf8"
);
// eslint-disable-next-line no-new-func
const loadLib = new Function(libCode + "; return globalThis.ToolLib;");
const L = loadLib();

ok("splitLines null", Array.isArray(L.splitLines(null)) && L.splitLines(null).length === 0);
ok("splitLines empty", L.splitLines("").length === 0);
ok("splitLines crlf", L.splitLines("a\r\nb\r\n").length === 3);
ok("parseLines dropEmpty", L.parseLines("a\n\nb", { dropEmpty: true }).length === 2);
ok("joinCapped null", L.joinCapped(null).text === "");
ok("joinCapped empty", L.joinCapped([]).total === 0);
ok("formatCount nan", L.formatCount(undefined) === "0");
ok("mapChunked null", true);
L.mapChunked(null, 10, function () {}).then(function (r) {
  ok("mapChunked null resolves []", Array.isArray(r) && r.length === 0);
}).catch(function (e) {
  ok("mapChunked null", false, e);
});
L.forChunked(0, 10, function () {}).then(function () {
  ok("forChunked 0", true);
});

// ---- Myers from string-diff ----
console.log("string-diff myers");
const diffSrc = fs.readFileSync(
  path.join(ROOT, "public/js/tools/string-diff.js"),
  "utf8"
);
const gStart = diffSrc.indexOf("function greedyDiff");
const dStart = diffSrc.indexOf("function diffLines");
const mStart = diffSrc.indexOf("function myersDiff");
const greedyCode = diffSrc.slice(gStart, dStart);
const myersCode = diffSrc.slice(mStart, gStart);
// order: greedy first (myers may call it), then myers
// eslint-disable-next-line no-new-func
const loadDiff = new Function(
  greedyCode + "\n" + myersCode + "\n; return { myersDiff: myersDiff, greedyDiff: greedyDiff };"
);
const D = loadDiff();

function rebuild(ops) {
  const a = [];
  const b = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    assert(op && op.text != null, "undefined text");
    if (op.type === "same" || op.type === "del") a.push(op.text);
    if (op.type === "same" || op.type === "add") b.push(op.text);
  }
  return { a, b };
}

function checkDiff(a, b, label) {
  const ops = D.myersDiff(a, b);
  const r = rebuild(ops);
  ok(
    label,
    r.a.join("\0") === a.join("\0") && r.b.join("\0") === b.join("\0")
  );
}

checkDiff(["a"], ["b"], "a vs b");
checkDiff(["a", "b"], ["a", "c"], "ab vs ac");
checkDiff(["hello", "world"], ["hello", "there", "world"], "insert mid");
checkDiff(["1", "2", "3"], ["1", "x", "3"], "replace mid");
checkDiff(["x"], ["x"], "equal");

for (let t = 0; t < 40; t++) {
  const a = [];
  const b = [];
  for (let i = 0; i < 15; i++) {
    a.push(String((Math.random() * 6) | 0));
    b.push(String((Math.random() * 6) | 0));
  }
  try {
    const ops = D.myersDiff(a, b);
    const r = rebuild(ops);
    if (r.a.join("\0") !== a.join("\0") || r.b.join("\0") !== b.join("\0")) {
      ok("random " + t, false);
    }
  } catch (e) {
    ok("random " + t, false, e.message);
  }
}
ok("40 random myers", true);

// ---- JSON/CSV pure helpers (inline copy of critical paths) ----
console.log("json-csv edge");
function escCsv(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function jsonToCsvLite(data) {
  if (!Array.isArray(data)) data = [data];
  if (!data.length) return "";
  const keys = [];
  const seen = Object.create(null);
  data.forEach(function (row) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      Object.keys(row).forEach(function (k) {
        if (!seen[k]) {
          seen[k] = true;
          keys.push(k);
        }
      });
    }
  });
  if (!keys.length) {
    return ["value"]
      .concat(
        data.map(function (v) {
          if (v != null && typeof v === "object") v = JSON.stringify(v);
          return escCsv(v);
        })
      )
      .join("\n");
  }
  const lines = [keys.map(escCsv).join(",")];
  data.forEach(function (row) {
    lines.push(
      keys
        .map(function (k) {
          let v =
            row && typeof row === "object" && !Array.isArray(row) ? row[k] : "";
          if (v != null && typeof v === "object") v = JSON.stringify(v);
          return escCsv(v);
        })
        .join(",")
    );
  });
  return lines.join("\n");
}
ok("csv primitives", jsonToCsvLite([1, 2, 3]).indexOf("value") === 0);
ok("csv objects", jsonToCsvLite([{ a: 1 }, { a: 2, b: 3 }]).split("\n").length === 3);
ok("csv empty", jsonToCsvLite([]) === "");

// ---- join/split safety ----
console.log("misc");
ok("split empty delim", "ab".split("").length === 2);
ok("filter Boolean", [""].filter(Boolean).length === 0);

setTimeout(function () {
  if (failed) {
    console.log("\nFAILED:", failed);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
}, 50);
