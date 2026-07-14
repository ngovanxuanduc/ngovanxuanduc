(function () {
  var aEl = document.getElementById("jd-a");
  var bEl = document.getElementById("jd-b");
  var out = document.getElementById("jd-out");
  var meta = document.getElementById("jd-meta");
  if (!aEl || !bEl || !out) return;

  function flatten(obj, prefix, map) {
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      var keys = Object.keys(obj);
      if (!keys.length) {
        map[prefix || "(root)"] = obj;
        return;
      }
      keys.forEach(function (k) {
        var p = prefix ? prefix + "." + k : k;
        flatten(obj[k], p, map);
      });
    } else if (Array.isArray(obj)) {
      if (!obj.length) {
        map[prefix] = obj;
        return;
      }
      obj.forEach(function (v, i) {
        flatten(v, prefix + "[" + i + "]", map);
      });
    } else {
      map[prefix] = obj;
    }
  }

  function run() {
    try {
      var a = JSON.parse(aEl.value);
      var b = JSON.parse(bEl.value);
      var am = {};
      var bm = {};
      flatten(a, "", am);
      flatten(b, "", bm);
      var keys = {};
      Object.keys(am).forEach(function (k) {
        keys[k] = true;
      });
      Object.keys(bm).forEach(function (k) {
        keys[k] = true;
      });
      var lines = [];
      Object.keys(keys)
        .sort()
        .forEach(function (k) {
          var ha = Object.prototype.hasOwnProperty.call(am, k);
          var hb = Object.prototype.hasOwnProperty.call(bm, k);
          if (ha && !hb) lines.push("- " + k + " = " + JSON.stringify(am[k]));
          else if (!ha && hb) lines.push("+ " + k + " = " + JSON.stringify(bm[k]));
          else if (JSON.stringify(am[k]) !== JSON.stringify(bm[k])) {
            lines.push("~ " + k + ": " + JSON.stringify(am[k]) + " → " + JSON.stringify(bm[k]));
          }
        });
      out.value = lines.length ? lines.join("\n") : "(no differences)";
      if (meta)
        meta.textContent = lines.length + " change(s) · paths compared";
    } catch (e) {
      out.value = "";
      if (meta) meta.textContent = "Lỗi JSON: " + e.message;
    }
  }

  document.getElementById("jd-run").onclick = run;
  if (window.ToolLib) {
    ToolLib.bindCopy("jd-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("jd-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
  run();
})();
