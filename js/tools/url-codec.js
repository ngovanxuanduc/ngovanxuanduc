(function () {
  var inn = document.getElementById("url-in");
  var out = document.getElementById("url-out");
  var meta = document.getElementById("url-meta");
  if (!inn || !out) return;
  function setMeta(m) {
    if (meta) meta.textContent = m || "";
  }
  document.getElementById("url-enc").onclick = function () {
    out.value = encodeURIComponent(inn.value);
    setMeta("encodeURIComponent");
  };
  document.getElementById("url-enc-full").onclick = function () {
    out.value = encodeURI(inn.value);
    setMeta("encodeURI (giữ :/?&#)");
  };
  document.getElementById("url-dec").onclick = function () {
    try {
      out.value = decodeURIComponent(inn.value.replace(/\+/g, " "));
      setMeta("Decoded");
    } catch (e) {
      setMeta("Decode lỗi");
    }
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("url-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("url-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
  document.getElementById("url-clear").onclick = function () {
    inn.value = out.value = "";
    setMeta("");
  };
})();
