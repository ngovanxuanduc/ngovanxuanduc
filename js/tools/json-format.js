(function () {
  var inn = document.getElementById("jf-in");
  var out = document.getElementById("jf-out");
  var meta = document.getElementById("jf-meta");
  var indentEl = document.getElementById("jf-indent");
  if (!inn || !out) return;

  function indent() {
    var v = indentEl.value;
    if (v === "tab") return "\t";
    return Number(v) || 2;
  }
  function setMeta(m, ok) {
    if (!meta) return;
    meta.textContent = m || "";
    meta.style.color = ok === false ? "var(--danger)" : "var(--text-dim)";
  }
  function parse() {
    return JSON.parse(inn.value);
  }

  document.getElementById("jf-pretty").onclick = function () {
    try {
      out.value = JSON.stringify(parse(), null, indent());
      setMeta("Pretty OK", true);
    } catch (e) {
      setMeta("Invalid JSON: " + e.message, false);
    }
  };
  document.getElementById("jf-minify").onclick = function () {
    try {
      out.value = JSON.stringify(parse());
      setMeta("Minified · " + out.value.length + " chars", true);
    } catch (e) {
      setMeta("Invalid JSON: " + e.message, false);
    }
  };
  document.getElementById("jf-validate").onclick = function () {
    try {
      parse();
      setMeta("Valid JSON ✓", true);
      out.value = "Valid JSON";
    } catch (e) {
      setMeta("Invalid: " + e.message, false);
      out.value = e.message;
    }
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("jf-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("jf-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
  document.getElementById("jf-clear").onclick = function () {
    inn.value = out.value = "";
    setMeta("");
  };
})();
