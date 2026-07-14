(function () {
  var fields = {
    b: document.getElementById("bs-b"),
    kb: document.getElementById("bs-kb"),
    mb: document.getElementById("bs-mb"),
    gb: document.getElementById("bs-gb"),
    tb: document.getElementById("bs-tb"),
  };
  var meta = document.getElementById("bs-meta");
  if (!fields.b) return;
  var lock = false;

  function base() {
    var r = document.querySelector('input[name="bs-base"]:checked');
    return r ? Number(r.value) : 1024;
  }

  function setFromBytes(bytes, except) {
    lock = true;
    var b = base();
    if (except !== "b") fields.b.value = String(bytes);
    if (except !== "kb") fields.kb.value = String(bytes / b);
    if (except !== "mb") fields.mb.value = String(bytes / (b * b));
    if (except !== "gb") fields.gb.value = String(bytes / (b * b * b));
    if (except !== "tb") fields.tb.value = String(bytes / (b * b * b * b));
    lock = false;
    if (meta) meta.textContent = Math.round(bytes).toLocaleString("en-US") + " bytes";
  }

  function on(key, pow) {
    fields[key].addEventListener("input", function () {
      if (lock) return;
      var n = Number(fields[key].value);
      if (!Number.isFinite(n)) return;
      var b = base();
      var bytes = n * Math.pow(b, pow);
      setFromBytes(bytes, key);
    });
  }
  on("b", 0);
  on("kb", 1);
  on("mb", 2);
  on("gb", 3);
  on("tb", 4);

  document.querySelectorAll('input[name="bs-base"]').forEach(function (el) {
    el.addEventListener("change", function () {
      var n = Number(fields.b.value);
      if (Number.isFinite(n)) setFromBytes(n, null);
    });
  });
  document.getElementById("bs-clear").onclick = function () {
    lock = true;
    Object.keys(fields).forEach(function (k) {
      fields[k].value = "";
    });
    lock = false;
    if (meta) meta.textContent = "";
  };
})();
