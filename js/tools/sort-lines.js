(function () {
  var input = document.getElementById("sl-input");
  var out = document.getElementById("sl-out");
  var meta = document.getElementById("sl-meta");
  var ignoreCase = document.getElementById("sl-ignore-case");
  var trimLines = document.getElementById("sl-trim");
  var dropEmpty = document.getElementById("sl-drop-empty");
  var numeric = document.getElementById("sl-numeric");
  var btnCopy = document.getElementById("sl-copy");
  var btnClear = document.getElementById("sl-clear");
  if (!input || !out || !window.ToolLib) return;

  var L = ToolLib;
  var fullResult = "";

  function linesOf() {
    return L.parseLines(input.value, {
      trim: trimLines && trimLines.checked,
      dropEmpty: dropEmpty && dropEmpty.checked,
    });
  }

  function cmp(a, b) {
    var ic = ignoreCase && ignoreCase.checked;
    var aa = ic ? a.toLowerCase() : a;
    var bb = ic ? b.toLowerCase() : b;
    if (numeric && numeric.checked) {
      return aa.localeCompare(bb, undefined, { numeric: true, sensitivity: "base" });
    }
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  }

  function apply(mode) {
    try {
    var t0 = performance.now();
    var lines = linesOf() || [];
    var result = lines.slice();
    var i, k, seen;

    switch (mode) {
      case "asc":
        result.sort(cmp);
        break;
      case "desc":
        result.sort(function (a, b) {
          return cmp(b, a);
        });
        break;
      case "reverse":
        result.reverse();
        break;
      case "shuffle":
        for (i = result.length - 1; i > 0; i--) {
          var j = (Math.random() * (i + 1)) | 0;
          var t = result[i];
          result[i] = result[j];
          result[j] = t;
        }
        break;
      case "unique-keep-order":
        seen = new Set();
        var keep = [];
        var ic = ignoreCase && ignoreCase.checked;
        for (i = 0; i < result.length; i++) {
          k = ic ? result[i].toLowerCase() : result[i];
          if (seen.has(k)) continue;
          seen.add(k);
          keep.push(result[i]);
        }
        result = keep;
        break;
      case "unique-sort":
        seen = new Set();
        keep = [];
        ic = ignoreCase && ignoreCase.checked;
        for (i = 0; i < result.length; i++) {
          k = ic ? result[i].toLowerCase() : result[i];
          if (seen.has(k)) continue;
          seen.add(k);
          keep.push(result[i]);
        }
        keep.sort(cmp);
        result = keep;
        break;
      default:
        break;
    }

    fullResult = result.join("\n");
    var capped = L.joinCapped(result, L.RENDER_LINES_MAX);
    out.value = capped.text;
    if (meta) {
      meta.textContent =
        "Vào: " +
        L.formatCount(lines.length) +
        " · Ra: " +
        L.formatCount(result.length) +
        " · " +
        Math.round(performance.now() - t0) +
        "ms" +
        (capped.truncated ? " · UI cap (Copy=full)" : "");
    }
    } catch (e) {
      fullResult = "";
      out.value = "";
      if (meta) meta.textContent = "Lỗi: " + (e && e.message ? e.message : e);
    }
  }

  document.querySelectorAll("[data-sl-op]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(btn.getAttribute("data-sl-op"));
    });
  });

  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      var text = fullResult || out.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }
    });

  if (btnClear)
    btnClear.addEventListener("click", function () {
      input.value = "";
      out.value = "";
      fullResult = "";
      if (meta) meta.textContent = "";
    });
})();
