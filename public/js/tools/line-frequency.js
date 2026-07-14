(function () {
  var input = document.getElementById("lf-input");
  var out = document.getElementById("lf-out");
  var meta = document.getElementById("lf-meta");
  var ignoreCase = document.getElementById("lf-ignore-case");
  var trimLines = document.getElementById("lf-trim");
  var dropEmpty = document.getElementById("lf-drop-empty");
  var onlyDup = document.getElementById("lf-only-dup");
  var sortBy = document.getElementById("lf-sort");
  var btnCopy = document.getElementById("lf-copy");
  var btnClear = document.getElementById("lf-clear");
  var btnRun = document.getElementById("lf-run");
  if (!input || !out || !window.ToolLib) return;

  var L = ToolLib;
  var fullResult = "";

  function run() {
    var t0 = performance.now();
    var lines = L.splitLines(input.value);
    var trim = trimLines && trimLines.checked;
    var drop = dropEmpty && dropEmpty.checked;
    var ic = ignoreCase && ignoreCase.checked;

    // key -> { display, count, order }
    var map = new Map();
    var order = [];
    var totalKept = 0;

    for (var i = 0; i < lines.length; i++) {
      var v = trim ? lines[i].trim() : lines[i];
      if (drop && v === "") continue;
      totalKept++;
      var k = ic ? v.toLowerCase() : v;
      var rec = map.get(k);
      if (!rec) {
        rec = { display: v, count: 0, ord: order.length };
        map.set(k, rec);
        order.push(rec);
      }
      rec.count++;
    }

    var rows = order;
    if (onlyDup && onlyDup.checked) {
      rows = [];
      for (var j = 0; j < order.length; j++) {
        if (order[j].count > 1) rows.push(order[j]);
      }
    } else {
      rows = order.slice();
    }

    var mode = sortBy ? sortBy.value : "freq-desc";
    if (mode === "first") {
      rows.sort(function (a, b) {
        return a.ord - b.ord;
      });
    } else if (mode === "freq-desc") {
      rows.sort(function (a, b) {
        return b.count - a.count || (a.display < b.display ? -1 : 1);
      });
    } else if (mode === "freq-asc") {
      rows.sort(function (a, b) {
        return a.count - b.count || (a.display < b.display ? -1 : 1);
      });
    } else if (mode === "alpha") {
      rows.sort(function (a, b) {
        return a.display < b.display ? -1 : a.display > b.display ? 1 : 0;
      });
    }

    var textLines = new Array(rows.length);
    for (var r = 0; r < rows.length; r++) {
      textLines[r] = rows[r].count + "\t" + rows[r].display;
    }
    fullResult = textLines.join("\n");
    var capped = L.joinCapped(textLines, L.RENDER_LINES_MAX);
    out.value = capped.text;

    if (meta) {
      meta.textContent =
        "Dòng: " +
        L.formatCount(totalKept) +
        " · Unique: " +
        L.formatCount(map.size) +
        " · Hiện: " +
        L.formatCount(rows.length) +
        " · " +
        Math.round(performance.now() - t0) +
        "ms" +
        (capped.truncated ? " · UI cap (Copy=full)" : "");
    }
  }

  function maybeAuto() {
    if (L.shouldAutoRun(input.value)) run();
    else if (meta) meta.textContent = "Dataset lớn — bấm «Chạy».";
  }

  // Add run button behavior if missing — use copy's neighbor; create handler on change
  if (btnRun) btnRun.addEventListener("click", run);
  else {
    // inject run via copy-area: still allow process on options + maybe
    var actions = document.querySelector(".tool-actions");
    if (actions && !document.getElementById("lf-run")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--primary btn--sm";
      b.id = "lf-run";
      b.textContent = "Chạy";
      b.addEventListener("click", run);
      actions.insertBefore(b, actions.firstChild);
    }
  }

  input.addEventListener("input", L.debounce(maybeAuto, 350));
  [ignoreCase, trimLines, dropEmpty, onlyDup, sortBy].forEach(function (el) {
    if (el) el.addEventListener("change", maybeAuto);
  });

  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      navigator.clipboard.writeText(fullResult || out.value).then(function () {
        btnCopy.textContent = "Đã copy";
        setTimeout(function () {
          btnCopy.textContent = "Copy";
        }, 1200);
      });
    });

  if (btnClear)
    btnClear.addEventListener("click", function () {
      input.value = "";
      out.value = "";
      fullResult = "";
      if (meta) meta.textContent = "";
    });
})();
