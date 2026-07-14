(function () {
  var input = document.getElementById("rd-input");
  var output = document.getElementById("rd-output");
  var meta = document.getElementById("rd-meta");
  var ignoreCase = document.getElementById("rd-ignore-case");
  var trimLines = document.getElementById("rd-trim");
  var keepEmpty = document.getElementById("rd-keep-empty");
  var btn = document.getElementById("rd-run");
  var btnCopy = document.getElementById("rd-copy");
  var btnClear = document.getElementById("rd-clear");
  if (!input || !output || !window.ToolLib) return;

  var L = ToolLib;
  var fullResult = "";

  function process() {
    try {
    var t0 = performance.now();
    var lines = L.splitLines(input.value) || [];
    var trim = trimLines && trimLines.checked;
    var keepEmp = keepEmpty && keepEmpty.checked;
    var ic = ignoreCase && ignoreCase.checked;
    var seen = new Set();
    var result = [];
    var removed = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var work = trim ? line.trim() : line;
      if (work === "" && !keepEmp) {
        removed++;
        continue;
      }
      var key = ic ? work.toLowerCase() : work;
      if (seen.has(key)) {
        removed++;
        continue;
      }
      seen.add(key);
      result.push(trim ? work : line);
    }

    fullResult = result.join("\n");
    var capped = L.joinCapped(result, L.RENDER_LINES_MAX);
    output.value = capped.text;
    if (meta) {
      meta.textContent =
        "Gốc: " +
        L.formatCount(lines.length) +
        " · Giữ: " +
        L.formatCount(result.length) +
        " · Bỏ: " +
        L.formatCount(removed) +
        " · " +
        Math.round(performance.now() - t0) +
        "ms" +
        (capped.truncated ? " · UI cap (Copy = full)" : "");
    }
    } catch (e) {
      fullResult = "";
      output.value = "";
      if (meta) meta.textContent = "Lỗi: " + (e && e.message ? e.message : e);
    }
  }

  function maybeAuto() {
    if (L.shouldAutoRun(input.value)) process();
    else if (meta) meta.textContent = "Dataset lớn — bấm «Chạy».";
  }

  if (btn) btn.addEventListener("click", process);
  input.addEventListener("input", L.debounce(maybeAuto, 350));
  [ignoreCase, trimLines, keepEmpty].forEach(function (el) {
    if (el) el.addEventListener("change", maybeAuto);
  });

  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy kết quả");
    btnCopy.addEventListener("click", function () {
      var text = fullResult || output.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }

  if (btnClear)
    btnClear.addEventListener("click", function () {
      input.value = "";
      output.value = "";
      fullResult = "";
      if (meta) meta.textContent = "";
    });
})();
