/**
 * Smoke tests for yaml-json / regex / cidr pure logic pieces.
 * Run: node scripts/smoke-devops-tools.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let failed = 0;
function ok(name, cond, detail) {
  if (cond) console.log("  ✓", name);
  else {
    failed++;
    console.log("  ✗", name, detail || "");
  }
}

// Load yaml-json.js in fake DOM
const yamlCode = fs.readFileSync(
  path.join(__dirname, "../public/js/tools/yaml-json.js"),
  "utf8"
);

function withYamlHandlers(inputValue) {
  const listeners = {};
  const els = {};
  function el(id, value) {
    const o = {
      id,
      value: value == null ? "" : value,
      style: {},
      addEventListener(type, fn) {
        listeners[id + ":" + type] = fn;
      },
    };
    els[id] = o;
    return o;
  }
  const inn = el("yj-in", inputValue);
  const out = el("yj-out", "");
  const meta = el("yj-meta", "");
  const indent = el("yj-indent", "2");
  const map = {
    "yj-in": inn,
    "yj-out": out,
    "yj-meta": meta,
    "yj-indent": indent,
    "yj-to-json": el("yj-to-json"),
    "yj-to-yaml": el("yj-to-yaml"),
    "yj-swap": el("yj-swap"),
    "yj-copy": el("yj-copy"),
    "yj-clear": el("yj-clear"),
  };
  const sandbox = {
    document: {
      getElementById(id) {
        return map[id] || null;
      },
    },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(yamlCode, sandbox);
  return { inn, out, meta, click(id) {
    const fn = listeners[id + ":click"];
    if (fn) fn();
  } };
}

console.log("YAML ↔ JSON");
{
  const y = `apiVersion: v1
kind: ConfigMap
metadata:
  name: demo
data:
  env: prod
  nested:
    a: 1
    b: true
list:
  - one
  - two
`;
  const h = withYamlHandlers(y);
  h.click("yj-to-json");
  let data;
  try {
    data = JSON.parse(h.out.value);
  } catch (e) {
    data = null;
  }
  ok("yaml→json parse", !!data, h.meta.value);
  ok("yaml kind", data && data.kind === "ConfigMap");
  ok("yaml nested", data && data.data && data.data.nested && data.data.nested.a === 1);
  ok("yaml list", data && Array.isArray(data.list) && data.list[1] === "two");

  const h2 = withYamlHandlers(JSON.stringify({ a: 1, b: ["x", "y"], c: true }, null, 2));
  h2.click("yj-to-yaml");
  ok("json→yaml has key", h2.out.value.indexOf("a: 1") !== -1, h2.out.value.slice(0, 80));
  ok("json→yaml list", h2.out.value.indexOf("- x") !== -1);

  // roundtrip
  const h3 = withYamlHandlers(h2.out.value);
  h3.click("yj-to-json");
  try {
    const rt = JSON.parse(h3.out.value);
    ok("roundtrip a", rt.a === 1);
    ok("roundtrip b", Array.isArray(rt.b) && rt.b[0] === "x");
  } catch (e) {
    ok("roundtrip", false, e.message + " " + h3.meta.value);
  }
}

console.log("CIDR math");
{
  function parseIPv4(str) {
    const s = String(str || "").trim();
    const parts = s.split(".");
    if (parts.length !== 4) return null;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      const o = Number(parts[i]);
      if (o < 0 || o > 255 || !Number.isFinite(o)) return null;
      if (parts[i].length > 1 && parts[i].charAt(0) === "0") return null;
      n = ((n << 8) | o) >>> 0;
    }
    return n;
  }
  function maskFromPrefix(prefix) {
    if (prefix === 0) return 0;
    if (prefix === 32) return 0xffffffff;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }
  function toIPv4(n) {
    n = n >>> 0;
    return (
      ((n >>> 24) & 255) +
      "." +
      ((n >>> 16) & 255) +
      "." +
      ((n >>> 8) & 255) +
      "." +
      (n & 255)
    );
  }
  const ip = parseIPv4("192.168.1.10");
  const mask = maskFromPrefix(24);
  const net = (ip & mask) >>> 0;
  const bcast = (net | (~mask >>> 0)) >>> 0;
  ok("network", toIPv4(net) === "192.168.1.0");
  ok("broadcast", toIPv4(bcast) === "192.168.1.255");
  ok("reject leading zero", parseIPv4("192.168.01.1") == null);
  ok("/32", maskFromPrefix(32) === 0xffffffff);
  ok("/0", maskFromPrefix(0) === 0);
}

console.log("Regex");
{
  const re = /(\w+)@([\w.]+)/g;
  const t = "user@example.com and admin@site.org";
  let n = 0;
  let m;
  while ((m = re.exec(t))) n++;
  ok("two emails", n === 2);
  try {
    // eslint-disable-next-line no-new
    new RegExp("[", "g");
    ok("bad regex throws", false);
  } catch (e) {
    ok("bad regex throws", true);
  }
}

if (failed) {
  console.log("\nFAILED", failed);
  process.exit(1);
}
console.log("\nOK");
