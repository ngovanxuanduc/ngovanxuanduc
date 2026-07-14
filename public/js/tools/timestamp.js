(function () {
  var u = document.getElementById("ts-unix");
  var ms = document.getElementById("ts-ms");
  var iso = document.getElementById("ts-iso");
  var local = document.getElementById("ts-local");
  var utc = document.getElementById("ts-utc");
  var meta = document.getElementById("ts-meta");
  if (!u) return;
  var lock = false;

  function fill(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      if (meta) meta.textContent = "Invalid date";
      return;
    }
    lock = true;
    u.value = String(Math.floor(d.getTime() / 1000));
    ms.value = String(d.getTime());
    iso.value = d.toISOString();
    local.value = d.toString();
    utc.value = d.toUTCString();
    lock = false;
    if (meta) meta.textContent = "OK";
  }

  function fromUnixSec(v) {
    var n = Number(v);
    if (!Number.isFinite(n)) return;
    // auto ms if looks like ms
    if (Math.abs(n) > 1e12) fill(new Date(n));
    else fill(new Date(n * 1000));
  }

  u.addEventListener("input", function () {
    if (lock) return;
    fromUnixSec(u.value.trim());
  });
  ms.addEventListener("input", function () {
    if (lock) return;
    var n = Number(ms.value.trim());
    if (Number.isFinite(n)) fill(new Date(n));
  });
  iso.addEventListener("input", function () {
    if (lock) return;
    var d = new Date(iso.value.trim());
    fill(d);
  });
  document.getElementById("ts-now").onclick = function () {
    fill(new Date());
  };
  document.getElementById("ts-clear").onclick = function () {
    lock = true;
    u.value = ms.value = iso.value = local.value = utc.value = "";
    lock = false;
    if (meta) meta.textContent = "";
  };
  fill(new Date());
})();
