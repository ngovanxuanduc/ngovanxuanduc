(function () {
  var aEl = document.getElementById("ls-a");
  var bEl = document.getElementById("ls-b");
  var outEl = document.getElementById("ls-out");
  var meta = document.getElementById("ls-meta");
  var ignoreCase = document.getElementById("ls-ignore-case");
  var trimLines = document.getElementById("ls-trim");
  var dropEmpty = document.getElementById("ls-drop-empty");
  var sortOut = document.getElementById("ls-sort");
  var opBtns = document.querySelectorAll("[data-ls-op]");
  var btnCopy = document.getElementById("ls-copy");
  var btnClear = document.getElementById("ls-clear");
  if (!aEl || !bEl || !outEl || !window.ToolLib) return;

  var L = ToolLib;
  var currentOp = "intersect";
  var fullResult = "";
  var cache = { sig: "", aMap: null, bMap: null, aKeys: null, bKeys: null };

  function opts() {
    return {
      trim: trimLines && trimLines.checked,
      dropEmpty: dropEmpty && dropEmpty.checked,
    };
  }

  function keyOf(line) {
    return ignoreCase && ignoreCase.checked ? line.toLowerCase() : line;
  }

  function toKeyMap(lines) {
    var map = new Map();
    if (!lines || !lines.length) return map;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i] == null ? "" : String(lines[i]);
      var k = keyOf(line);
      if (!map.has(k)) map.set(k, line);
    }
    return map;
  }

  function signature() {
    return [
      aEl.value.length,
      bEl.value.length,
      ignoreCase && ignoreCase.checked ? 1 : 0,
      trimLines && trimLines.checked ? 1 : 0,
      dropEmpty && dropEmpty.checked ? 1 : 0,
      // content hash light: first/last 64 + length
      aEl.value.slice(0, 64),
      aEl.value.slice(-64),
      bEl.value.slice(0, 64),
      bEl.value.slice(-64),
    ].join("|");
  }

  function ensureMaps() {
    var sig = signature();
    if (cache.sig === sig && cache.aMap) return cache;
    var a = L.parseLines(aEl.value, opts());
    var b = L.parseLines(bEl.value, opts());
    cache.sig = sig;
    cache.aMap = toKeyMap(a);
    cache.bMap = toKeyMap(b);
    cache.aKeys = Array.from(cache.aMap.keys());
    cache.bKeys = Array.from(cache.bMap.keys());
    cache.aLines = a;
    cache.bLines = b;
    return cache;
  }

  function run() {
    try {
    var t0 = performance.now();
    var m = ensureMaps();
    var aMap = m.aMap;
    var bMap = m.bMap;
    var aKeys = m.aKeys || [];
    var bKeys = m.bKeys || [];
    var out = [];
    var label = "";
    var i, k;

    switch (currentOp) {
      case "intersect":
        label = "Giao (A ∩ B)";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (bMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "only-a":
        label = "Chỉ A (A − B)";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (!bMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "only-b":
        label = "Chỉ B (B − A)";
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k)) out.push(bMap.get(k));
        }
        break;
      case "union":
        label = "Hợp (A ∪ B)";
        for (i = 0; i < aKeys.length; i++) out.push(aMap.get(aKeys[i]));
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k)) out.push(bMap.get(k));
        }
        break;
      case "symdiff":
        label = "Đối xứng";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (!bMap.has(k)) out.push(aMap.get(k));
        }
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k)) out.push(bMap.get(k));
        }
        break;
      default:
        label = currentOp;
    }

    if (sortOut && sortOut.checked) {
      var ic = ignoreCase && ignoreCase.checked;
      out.sort(function (x, y) {
        var xx = ic ? x.toLowerCase() : x;
        var yy = ic ? y.toLowerCase() : y;
        return xx < yy ? -1 : xx > yy ? 1 : 0;
      });
    }

    fullResult = out.join("\n");
    var capped = L.joinCapped(out, L.RENDER_LINES_MAX);
    outEl.value = capped.text;

    var ms = Math.round(performance.now() - t0);
    if (meta) {
      meta.textContent =
        label +
        " · A:" +
        L.formatCount(aKeys.length) +
        " B:" +
        L.formatCount(bKeys.length) +
        " · KQ:" +
        L.formatCount(out.length) +
        " · " +
        ms +
        "ms" +
        (capped.truncated ? " · UI cap " + capped.shown : "");
    }
    } catch (e) {
      fullResult = "";
      outEl.value = "";
      if (meta) meta.textContent = "Lỗi: " + (e && e.message ? e.message : e);
    }
  }

  function setActive(op) {
    currentOp = op;
    for (var i = 0; i < opBtns.length; i++) {
      var btn = opBtns[i];
      var active = btn.getAttribute("data-ls-op") === op;
      btn.classList.toggle("btn--primary", active);
      btn.classList.toggle("btn--ghost", !active);
    }
    run();
  }

  function maybeAuto() {
    cache.sig = ""; // invalidate
    if (L.shouldAutoRun(aEl.value, bEl.value)) run();
    else if (meta) {
      meta.textContent = "Dataset lớn — bấm phép toán (Giao / Chỉ A / …) để chạy.";
    }
  }

  for (var i = 0; i < opBtns.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        cache.sig = "";
        setActive(btn.getAttribute("data-ls-op"));
      });
    })(opBtns[i]);
  }

  var debounced = L.debounce(maybeAuto, 350);
  aEl.addEventListener("input", debounced);
  bEl.addEventListener("input", debounced);
  [ignoreCase, trimLines, dropEmpty, sortOut].forEach(function (el) {
    if (el)
      el.addEventListener("change", function () {
        cache.sig = "";
        maybeAuto();
      });
  });

  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      var text = fullResult || outEl.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }
    });

  if (btnClear)
    btnClear.addEventListener("click", function () {
      aEl.value = "";
      bEl.value = "";
      outEl.value = "";
      fullResult = "";
      cache.sig = "";
      if (meta) meta.textContent = "";
    });

  setActive("intersect");
})();
