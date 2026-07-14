(function () {
  var inn = document.getElementById("nf-in");
  var out = document.getElementById("nf-out");
  var dec = document.getElementById("nf-dec");
  var meta = document.getElementById("nf-meta");
  if (!inn || !out) return;

  function run() {
    var raw = inn.value.trim().replace(/,/g, "");
    var n = Number(raw);
    if (!Number.isFinite(n)) {
      if (meta) meta.textContent = "Không phải số hợp lệ";
      out.innerHTML = "";
      return;
    }
    var d = Math.min(12, Math.max(0, parseInt(dec.value, 10) || 0));
    var rows = [
      ["Grouped (en)", n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d })],
      ["Grouped (vi)", n.toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: d })],
      ["Percent", (n * 100).toLocaleString("en-US", { maximumFractionDigits: d }) + "%"],
      ["Scientific", n.toExponential(d)],
      ["Compact", n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })],
      ["Integer", String(Math.trunc(n))],
      ["Absolute", String(Math.abs(n))],
    ];
    out.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="tool-field"><label>' +
          r[0] +
          '</label><input class="tool-input" readonly value="' +
          String(r[1]).replace(/"/g, "&quot;") +
          '" /></div>'
        );
      })
      .join("");
    if (meta) meta.textContent = "n = " + n;
  }

  document.getElementById("nf-run").onclick = run;
  inn.addEventListener("input", run);
  dec.addEventListener("change", run);
  document.getElementById("nf-copy").onclick = function () {
    var first = out.querySelector("input");
    if (first) navigator.clipboard.writeText(first.value);
  };
  run();
})();
