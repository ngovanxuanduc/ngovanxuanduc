(function () {
  var inn = document.getElementById("ps-in");
  var out = document.getElementById("ps-out");
  var pre = document.getElementById("ps-pre");
  var suf = document.getElementById("ps-suf");
  var meta = document.getElementById("ps-meta");
  if (!inn || !out) return;

  function lines() {
    return inn.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  }

  document.getElementById("ps-add").onclick = function () {
    var p = pre.value;
    var s = suf.value;
    var res = lines().map(function (l) {
      return p + l + s;
    });
    out.value = res.join("\n");
    if (meta) meta.textContent = res.length + " lines";
  };
  document.getElementById("ps-strip").onclick = function () {
    var p = pre.value;
    var s = suf.value;
    var res = lines().map(function (l) {
      var x = l;
      if (p && x.indexOf(p) === 0) x = x.slice(p.length);
      if (s && x.length >= s.length && x.slice(-s.length) === s) {
        x = x.slice(0, -s.length);
      }
      return x;
    });
    out.value = res.join("\n");
    if (meta) meta.textContent = "Stripped " + res.length + " lines";
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("ps-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("ps-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
})();
