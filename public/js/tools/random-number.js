(function () {
  var out = document.getElementById("rn-out");
  var meta = document.getElementById("rn-meta");
  if (!out) return;

  function randInt(min, max) {
    var range = max - min + 1;
    if (range <= 0) throw new Error("max phải ≥ min");
    var maxUnbiased = Math.floor(0x100000000 / range) * range;
    var buf = new Uint32Array(1);
    var x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= maxUnbiased);
    return min + (x % range);
  }

  document.getElementById("rn-gen").onclick = function () {
    try {
      var min = parseInt(document.getElementById("rn-min").value, 10);
      var max = parseInt(document.getElementById("rn-max").value, 10);
      var n = Math.min(10000, Math.max(1, parseInt(document.getElementById("rn-n").value, 10) || 1));
      var unique = document.getElementById("rn-unique").checked;
      if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("min/max không hợp lệ");
      if (min > max) {
        var t = min;
        min = max;
        max = t;
      }
      var range = max - min + 1;
      if (unique && n > range) throw new Error("Unique: count > range");
      var lines = [];
      if (unique) {
        var set = new Set();
        while (set.size < n) set.add(randInt(min, max));
        lines = Array.from(set);
      } else {
        for (var i = 0; i < n; i++) lines.push(randInt(min, max));
      }
      out.value = lines.join("\n");
      if (meta) meta.textContent = n + " số · [" + min + ", " + max + "]";
    } catch (e) {
      if (meta) meta.textContent = e.message;
    }
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("rn-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("rn-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
})();
