(function () {
  var out = document.getElementById("uuid-out");
  var nEl = document.getElementById("uuid-n");
  var upper = document.getElementById("uuid-upper");
  var meta = document.getElementById("uuid-meta");
  if (!out) return;

  function uuidv4() {
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.from(b, function (x) {
      return x.toString(16).padStart(2, "0");
    }).join("");
    return (
      h.slice(0, 8) +
      "-" +
      h.slice(8, 12) +
      "-" +
      h.slice(12, 16) +
      "-" +
      h.slice(16, 20) +
      "-" +
      h.slice(20)
    );
  }

  document.getElementById("uuid-gen").onclick = function () {
    var n = Math.min(10000, Math.max(1, parseInt(nEl.value, 10) || 1));
    var lines = new Array(n);
    for (var i = 0; i < n; i++) {
      var u = uuidv4();
      lines[i] = upper.checked ? u.toUpperCase() : u;
    }
    out.value = lines.join("\n");
    if (meta) meta.textContent = n + " UUID v4";
  };
  document.getElementById("uuid-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
  document.getElementById("uuid-clear").onclick = function () {
    out.value = "";
    if (meta) meta.textContent = "";
  };
})();
