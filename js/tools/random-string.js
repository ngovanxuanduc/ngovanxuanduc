(function () {
  var out = document.getElementById("rs-out");
  var meta = document.getElementById("rs-meta");
  if (!out) return;

  function isChecked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function charset() {
    var s = "";
    if (isChecked("rs-lower")) s += "abcdefghijklmnopqrstuvwxyz";
    if (isChecked("rs-upper")) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (isChecked("rs-digit")) s += "0123456789";
    if (isChecked("rs-symbol")) s += "!@#$%^&*()-_=+[]{};:,.?";
    return s;
  }

  function randString(len, chars) {
    if (!chars || !chars.length) return "";
    var result = "";
    var max = Math.floor(256 / chars.length) * chars.length;
    if (max <= 0) return "";
    while (result.length < len) {
      var buf = new Uint8Array(len - result.length + 8);
      crypto.getRandomValues(buf);
      for (var i = 0; i < buf.length && result.length < len; i++) {
        if (buf[i] < max) result += chars.charAt(buf[i] % chars.length);
      }
    }
    return result;
  }

  var btnGen = document.getElementById("rs-gen");
  if (btnGen)
    btnGen.addEventListener("click", function () {
      var chars = charset();
      if (!chars) {
        if (meta) meta.textContent = "Chọn ít nhất 1 charset";
        return;
      }
      var lenEl = document.getElementById("rs-len");
      var nEl = document.getElementById("rs-n");
      var len = Math.min(
        1024,
        Math.max(1, parseInt(lenEl && lenEl.value, 10) || 16)
      );
      var n = Math.min(500, Math.max(1, parseInt(nEl && nEl.value, 10) || 1));
      var lines = new Array(n);
      for (var i = 0; i < n; i++) lines[i] = randString(len, chars);
      out.value = lines.join("\n");
      if (meta) meta.textContent = n + " × " + len + " chars";
    });
  var btnCopy = document.getElementById("rs-copy");
  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      var text = out.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }
})();
