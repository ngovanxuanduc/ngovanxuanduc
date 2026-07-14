(function () {
  var aEl = document.getElementById("ls3-a");
  var bEl = document.getElementById("ls3-b");
  var cEl = document.getElementById("ls3-c");
  var outEl = document.getElementById("ls3-out");
  var meta = document.getElementById("ls3-meta");
  var ignoreCase = document.getElementById("ls3-ignore-case");
  var trimLines = document.getElementById("ls3-trim");
  var dropEmpty = document.getElementById("ls3-drop-empty");
  var sortOut = document.getElementById("ls3-sort");
  var opBtns = document.querySelectorAll("[data-ls3-op]");
  var btnCopy = document.getElementById("ls3-copy");
  var btnClear = document.getElementById("ls3-clear");
  if (!aEl || !bEl || !cEl || !outEl || !window.ToolLib) return;

  var L = ToolLib;
  var currentOp = "abc";
  var fullResult = "";
  var cache = { sig: "" };

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
      cEl.value.length,
      ignoreCase && ignoreCase.checked ? 1 : 0,
      trimLines && trimLines.checked ? 1 : 0,
      dropEmpty && dropEmpty.checked ? 1 : 0,
      aEl.value.slice(0, 48),
      aEl.value.slice(-48),
      bEl.value.slice(0, 48),
      bEl.value.slice(-48),
      cEl.value.slice(0, 48),
      cEl.value.slice(-48),
    ].join("|");
  }

  function ensureMaps() {
    var sig = signature();
    if (cache.sig === sig && cache.aMap) return cache;
    var o = opts();
    cache.sig = sig;
    cache.aMap = toKeyMap(L.parseLines(aEl.value, o));
    cache.bMap = toKeyMap(L.parseLines(bEl.value, o));
    cache.cMap = toKeyMap(L.parseLines(cEl.value, o));
    cache.aKeys = Array.from(cache.aMap.keys());
    cache.bKeys = Array.from(cache.bMap.keys());
    cache.cKeys = Array.from(cache.cMap.keys());
    return cache;
  }

  function run() {
    try {
    var t0 = performance.now();
    var m = ensureMaps();
    var aMap = m.aMap;
    var bMap = m.bMap;
    var cMap = m.cMap;
    var aKeys = m.aKeys || [];
    var bKeys = m.bKeys || [];
    var cKeys = m.cKeys || [];
    var out = [];
    var label = "";
    var i, k, inB, inC;

    switch (currentOp) {
      case "abc":
        label = "A ∩ B ∩ C";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (bMap.has(k) && cMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "ab":
        label = "A ∩ B";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (bMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "ac":
        label = "A ∩ C";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (cMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "bc":
        label = "B ∩ C";
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (cMap.has(k)) out.push(bMap.get(k));
        }
        break;
      case "ab-not-c":
        label = "(A ∩ B) − C";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (bMap.has(k) && !cMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "only-a":
        label = "Chỉ A";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (!bMap.has(k) && !cMap.has(k)) out.push(aMap.get(k));
        }
        break;
      case "only-b":
        label = "Chỉ B";
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k) && !cMap.has(k)) out.push(bMap.get(k));
        }
        break;
      case "only-c":
        label = "Chỉ C";
        for (i = 0; i < cKeys.length; i++) {
          k = cKeys[i];
          if (!aMap.has(k) && !bMap.has(k)) out.push(cMap.get(k));
        }
        break;
      case "exactly-one":
        label = "Đúng 1 list";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          if (!bMap.has(k) && !cMap.has(k)) out.push(aMap.get(k));
        }
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k) && !cMap.has(k)) out.push(bMap.get(k));
        }
        for (i = 0; i < cKeys.length; i++) {
          k = cKeys[i];
          if (!aMap.has(k) && !bMap.has(k)) out.push(cMap.get(k));
        }
        break;
      case "exactly-two":
        label = "Đúng 2 list";
        for (i = 0; i < aKeys.length; i++) {
          k = aKeys[i];
          inB = bMap.has(k);
          inC = cMap.has(k);
          if ((inB && !inC) || (!inB && inC)) out.push(aMap.get(k));
        }
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k) && cMap.has(k)) out.push(bMap.get(k));
        }
        break;
      case "union":
        label = "A ∪ B ∪ C";
        for (i = 0; i < aKeys.length; i++) out.push(aMap.get(aKeys[i]));
        for (i = 0; i < bKeys.length; i++) {
          k = bKeys[i];
          if (!aMap.has(k)) out.push(bMap.get(k));
        }
        for (i = 0; i < cKeys.length; i++) {
          k = cKeys[i];
          if (!aMap.has(k) && !bMap.has(k)) out.push(cMap.get(k));
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
        " C:" +
        L.formatCount(cKeys.length) +
        " · KQ:" +
        L.formatCount(out.length) +
        " · " +
        ms +
        "ms" +
        (capped.truncated ? " · UI cap" : "");
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
      var active = btn.getAttribute("data-ls3-op") === op;
      btn.classList.toggle("btn--primary", active);
      btn.classList.toggle("btn--ghost", !active);
    }
    run();
  }

  function maybeAuto() {
    cache.sig = "";
    if (L.shouldAutoRun(aEl.value, bEl.value, cEl.value)) run();
    else if (meta) {
      meta.textContent = "Dataset lớn — bấm phép toán để chạy.";
    }
  }

  for (var i = 0; i < opBtns.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        cache.sig = "";
        setActive(btn.getAttribute("data-ls3-op"));
      });
    })(opBtns[i]);
  }

  var debounced = L.debounce(maybeAuto, 350);
  [aEl, bEl, cEl].forEach(function (el) {
    el.addEventListener("input", debounced);
  });
  [ignoreCase, trimLines, dropEmpty, sortOut].forEach(function (el) {
    if (el)
      el.addEventListener("change", function () {
        cache.sig = "";
        maybeAuto();
      });
  });

  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      navigator.clipboard.writeText(fullResult || outEl.value).then(function () {
        btnCopy.textContent = "Đã copy";
        setTimeout(function () {
          btnCopy.textContent = "Copy";
        }, 1200);
      });
    });

  if (btnClear)
    btnClear.addEventListener("click", function () {
      aEl.value = bEl.value = cEl.value = outEl.value = "";
      fullResult = "";
      cache.sig = "";
      if (meta) meta.textContent = "";
    });

  setActive("abc");
})();
