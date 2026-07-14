(function () {
  var out = document.getElementById("rs-out");
  var meta = document.getElementById("rs-meta");
  if (!out) return;

  function charset() {
    var s = "";
    if (document.getElementById("rs-lower").checked) s += "abcdefghijklmnopqrstuvwxyz";
    if (document.getElementById("rs-upper").checked) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (document.getElementById("rs-digit").checked) s += "0123456789";
    if (document.getElementById("rs-symbol").checked) s += "!@#$%^&*()-_=+[]{};:,.?";
    return s;
  }

  function randString(len, chars) {
    var result = "";
    var max = Math.floor(256 / chars.length) * chars.length;
    while (result.length < len) {
      var buf = new Uint8Array(len - result.length + 8);
      crypto.getRandomValues(buf);
      for (var i = 0; i < buf.length && result.length < len; i++) {
        if (buf[i] < max) result += chars[buf[i] % chars.length];
      }
    }
    return result;
  }

  document.getElementById("rs-gen").onclick = function () {
    var chars = charset();
    if (!chars) {
      if (meta) meta.textContent = "Chọn ít nhất 1 charset";
      return;
    }
    var len = Math.min(1024, Math.max(1, parseInt(document.getElementById("rs-len").value, 10) || 16));
    var n = Math.min(500, Math.max(1, parseInt(document.getElementById("rs-n").value, 10) || 1));
    var lines = new Array(n);
    for (var i = 0; i < n; i++) lines[i] = randString(len, chars);
    out.value = lines.join("\n");
    if (meta) meta.textContent = n + " × " + len + " chars";
  };
  document.getElementById("rs-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
})();
