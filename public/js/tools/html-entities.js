(function () {
  var inn = document.getElementById("he-in");
  var out = document.getElementById("he-out");
  var meta = document.getElementById("he-meta");
  if (!inn || !out) return;

  function encode(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function decode(s) {
    var el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }
  function setMeta(m) {
    if (meta) meta.textContent = m || "";
  }

  document.getElementById("he-enc").onclick = function () {
    out.value = encode(inn.value);
    setMeta("Encoded");
  };
  document.getElementById("he-dec").onclick = function () {
    out.value = decode(inn.value);
    setMeta("Decoded");
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("he-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("he-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
  document.getElementById("he-clear").onclick = function () {
    inn.value = out.value = "";
    setMeta("");
  };
})();
