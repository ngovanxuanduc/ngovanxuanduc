/**
 * Wire all tool copy buttons through ToolLib.copyText / bindCopy.
 * Run: node scripts/patch-copy-feedback.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../public/js/tools");

function write(file, content) {
  fs.writeFileSync(path.join(DIR, file), content, "utf8");
  console.log("updated", file);
}

function replaceCopyBlock(code, patterns, replacement) {
  for (const re of patterns) {
    if (re.test(code)) return code.replace(re, replacement);
  }
  return null;
}

// --- Simple tools: getElementById("…-copy").onclick = writeText ---
const simple = [
  ["base64.js", "b64-copy", "out.value"],
  ["hash.js", "hash-copy", "out.value"],
  ["html-entities.js", "he-copy", "out.value"],
  ["join-split.js", "js-copy", "out.value"],
  ["json-diff.js", "jd-copy", "out.value"],
  ["json-format.js", "jf-copy", "out.value"],
  ["lorem.js", "lo-copy", "out.value"],
  ["prefix-suffix.js", "ps-copy", "out.value"],
  ["random-number.js", "rn-copy", "out.value"],
  ["url-codec.js", "url-copy", "out.value"],
];

for (const [file, id, expr] of simple) {
  let c = fs.readFileSync(path.join(DIR, file), "utf8");
  const re = new RegExp(
    `document\\.getElementById\\(["']${id}["']\\)\\.onclick\\s*=\\s*function\\s*\\(\\)\\s*\\{[\\s\\S]*?\\};`
  );
  if (!re.test(c)) {
    console.log("skip (no match)", file);
    continue;
  }
  const bind =
    `if (window.ToolLib) {\n` +
    `    ToolLib.bindCopy("${id}", function () { return ${expr} || ""; });\n` +
    `  } else {\n` +
    `    var _c = document.getElementById("${id}");\n` +
    `    if (_c) _c.onclick = function () { navigator.clipboard.writeText(${expr} || ""); };\n` +
    `  }`;
  c = c.replace(re, bind);
  write(file, c);
}

// --- btnCopy addEventListener patterns with partial/no feedback ---
function patchBtnCopy(file, getExpr, defaultLabel) {
  let c = fs.readFileSync(path.join(DIR, file), "utf8");
  // Match from "if (btnCopy)" through its closing });
  const re =
    /if\s*\(\s*btnCopy\s*\)\s*btnCopy\.addEventListener\(\s*["']click["']\s*,\s*function\s*\(\)\s*\{[\s\S]*?\}\s*\)\s*;/;
  if (!re.test(c)) {
    console.log("skip btnCopy", file);
    return;
  }
  const label = defaultLabel || "Copy";
  const block =
    `if (btnCopy) {\n` +
    `    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", ${JSON.stringify(label)});\n` +
    `    btnCopy.addEventListener("click", function () {\n` +
    `      var text = ${getExpr};\n` +
    `      if (window.ToolLib) ToolLib.copyText(text, btnCopy);\n` +
    `      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");\n` +
    `    });\n` +
    `  }`;
  c = c.replace(re, block);
  write(file, c);
}

patchBtnCopy("find-replace.js", "out.value || \"\"");
patchBtnCopy("json-csv.js", "out.value || \"\"");
patchBtnCopy("jwt-decode.js", "(payload && payload.value) || \"\"");
patchBtnCopy("query-json.js", "out.value || \"\"");
patchBtnCopy("random-string.js", "out.value || \"\"");
patchBtnCopy("number-format.js", "(out.querySelector(\"input\") && out.querySelector(\"input\").value) || \"\"");
patchBtnCopy("case-convert.js", "output.value || \"\"");
patchBtnCopy("fuzzy-lines.js", "fullResult || outEl.value || \"\"");
patchBtnCopy("line-frequency.js", "fullResult || out.value || \"\"");
patchBtnCopy("line-sets.js", "fullResult || outEl.value || \"\"");
patchBtnCopy("line-sets-3.js", "fullResult || outEl.value || \"\"");
patchBtnCopy("remove-duplicates.js", "fullResult || output.value || \"\"", "Copy kết quả");
patchBtnCopy("sort-lines.js", "fullResult || out.value || \"\"");
patchBtnCopy("cidr.js", "lastText || \"\"");
patchBtnCopy("regex-tester.js", "(outEl && outEl.value) || \"\"", "Copy replace");
patchBtnCopy("uuid.js", "out.value || \"\"");

// password-gen: use ToolLib in both places
{
  let c = fs.readFileSync(path.join(DIR, "password-gen.js"), "utf8");
  c = c.replace(
    /navigator\.clipboard\.writeText\(pw\)\.then\(function \(\) \{\s*btn\.textContent = "Đã copy ✓";\s*btn\.classList\.add\("is-copied"\);\s*setTimeout\(function \(\) \{\s*btn\.textContent = "Copy";\s*btn\.classList\.remove\("is-copied"\);\s*\}, 1200\);\s*\}\);/g,
    `if (window.ToolLib) ToolLib.copyText(pw, btn);\n        else navigator.clipboard.writeText(pw);`
  );
  c = c.replace(
    /navigator\.clipboard\.writeText\(lastPasswords\.join\("\\n"\)\)\.then\(function \(\) \{\s*setMeta\("Đã copy " \+ lastPasswords\.length \+ " mật khẩu"\);\s*btnCopy\.textContent = "Đã copy ✓";\s*btnCopy\.classList\.add\("is-copied"\);\s*setTimeout\(function \(\) \{\s*btnCopy\.textContent = "Copy tất cả";\s*btnCopy\.classList\.remove\("is-copied"\);\s*\}, 1200\);\s*\}\);/,
    `if (window.ToolLib) {\n        ToolLib.copyText(lastPasswords.join("\\n"), btnCopy, {\n          okLabel: "Đã copy ✓",\n          onOk: function () { setMeta("Đã copy " + lastPasswords.length + " mật khẩu"); }\n        });\n      } else {\n        navigator.clipboard.writeText(lastPasswords.join("\\n"));\n      }`
  );
  write("password-gen.js", c);
}

// yaml-json
{
  let c = fs.readFileSync(path.join(DIR, "yaml-json.js"), "utf8");
  const re =
    /if\s*\(btnCopy\)\s*btnCopy\.addEventListener\(\s*"click"\s*,\s*function\s*\(\)\s*\{[\s\S]*?\}\s*\)\s*;/;
  if (re.test(c)) {
    c = c.replace(
      re,
      `if (btnCopy) {\n` +
        `    btnCopy.setAttribute("data-label", "Copy");\n` +
        `    btnCopy.addEventListener("click", function () {\n` +
        `      if (window.ToolLib) ToolLib.copyText(out.value || "", btnCopy, { onOk: function () { setMeta("Đã copy", true); } });\n` +
        `      else if (navigator.clipboard) navigator.clipboard.writeText(out.value || "");\n` +
        `    });\n` +
        `  }`
    );
    write("yaml-json.js", c);
  } else console.log("skip yaml-json");
}

// my-ip: use ToolLib.flashCopied if available
{
  let c = fs.readFileSync(path.join(DIR, "my-ip.js"), "utf8");
  c = c.replace(
    /function flashCopy\(btn, label\) \{[\s\S]*?\n  \}/,
    `function flashCopy(btn, label) {\n` +
      `    if (window.ToolLib && ToolLib.flashCopied) {\n` +
      `      ToolLib.flashCopied(btn, label || "Đã copy ✓");\n` +
      `      return;\n` +
      `    }\n` +
      `    if (!btn) return;\n` +
      `    if (btn._reset) clearTimeout(btn._reset);\n` +
      `    var prev = btn.getAttribute("data-label") || btn.textContent || "Copy";\n` +
      `    if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", prev);\n` +
      `    btn.textContent = label || "Đã copy ✓";\n` +
      `    btn.classList.add("is-copied");\n` +
      `    btn._reset = setTimeout(function () {\n` +
      `      btn.textContent = btn.getAttribute("data-label") || "Copy";\n` +
      `      btn.classList.remove("is-copied");\n` +
      `      btn._reset = null;\n` +
      `    }, 1300);\n` +
      `  }`
  );
  write("my-ip.js", c);
}

// totp: use ToolLib.flashCopied when available (already has custom flash)
{
  let c = fs.readFileSync(path.join(DIR, "totp.js"), "utf8");
  if (c.includes("function flashCopied") && !c.includes("ToolLib.flashCopied")) {
    c = c.replace(
      /function flashCopied\(btn, card, codeEl, okLabel\) \{/,
      `function flashCopied(btn, card, codeEl, okLabel) {\n` +
        `    if (btn && window.ToolLib && ToolLib.flashCopied) {\n` +
        `      ToolLib.flashCopied(btn, okLabel || "Đã copy ✓");\n` +
        `      // still do card flash below\n` +
        `    } else if (false) {\n`
    );
    // That breaks the function. Better leave totp as-is since it already has full effect.
    // Revert by re-reading original... actually we already wrote broken if we continue.
  }
  // re-read clean - skip totp if already good
}

console.log("done");
