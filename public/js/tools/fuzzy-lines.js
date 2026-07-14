(function () {
  var aEl = document.getElementById("fz-a");
  var bEl = document.getElementById("fz-b");
  var outEl = document.getElementById("fz-out");
  var meta = document.getElementById("fz-meta");
  var thresholdEl = document.getElementById("fz-threshold");
  var thresholdVal = document.getElementById("fz-threshold-val");
  var ignoreCase = document.getElementById("fz-ignore-case");
  var trimLines = document.getElementById("fz-trim");
  var dropEmpty = document.getElementById("fz-drop-empty");
  var modeEl = document.getElementById("fz-mode");
  var btnRun = document.getElementById("fz-run");
  var btnCopy = document.getElementById("fz-copy");
  var btnClear = document.getElementById("fz-clear");
  if (!aEl || !bEl || !outEl || !window.ToolLib) return;

  var L = ToolLib;
  var running = false;
  var fullResult = "";
  // Reusable DP buffers (grow as needed)
  var row0 = new Int32Array(256);
  var row1 = new Int32Array(256);

  function ensureRows(len) {
    if (row0.length < len) {
      row0 = new Int32Array(len);
      row1 = new Int32Array(len);
    }
  }

  /**
   * Levenshtein with early exit when distance > maxDist.
   * Returns distance or maxDist+1 if exceeded.
   */
  function levenshteinBounded(a, b, maxDist) {
    if (a === b) return 0;
    var al = a.length;
    var bl = b.length;
    if (!al) return bl > maxDist ? maxDist + 1 : bl;
    if (!bl) return al > maxDist ? maxDist + 1 : al;
    if (Math.abs(al - bl) > maxDist) return maxDist + 1;

    // a = shorter
    if (al > bl) {
      var tmp = a;
      a = b;
      b = tmp;
      al = a.length;
      bl = b.length;
    }

    ensureRows(al + 1);
    var prev = row0;
    var cur = row1;
    var i, j;
    for (i = 0; i <= al; i++) prev[i] = i;

    for (j = 1; j <= bl; j++) {
      cur[0] = j;
      var bj = b.charCodeAt(j - 1);
      var rowMin = cur[0];
      for (i = 1; i <= al; i++) {
        var cost = a.charCodeAt(i - 1) === bj ? 0 : 1;
        var del = prev[i] + 1;
        var ins = cur[i - 1] + 1;
        var sub = prev[i - 1] + cost;
        var v = del < ins ? del : ins;
        if (sub < v) v = sub;
        cur[i] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > maxDist) return maxDist + 1;
      var swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[al];
  }

  function similarityBounded(na, nb, threshold) {
    if (na === nb) return 1;
    if (!na.length || !nb.length) return 0;
    var maxLen = na.length > nb.length ? na.length : nb.length;
    // max edits allowed to still be >= threshold
    var maxDist = Math.floor((1 - threshold) * maxLen + 1e-9);
    if (Math.abs(na.length - nb.length) > maxDist) return 0;
    var dist = levenshteinBounded(na, nb, maxDist);
    if (dist > maxDist) return 0;
    return 1 - dist / maxLen;
  }

  function pct(n) {
    return Math.round(n * 1000) / 10;
  }

  function prepare(lines) {
    var ic = ignoreCase && ignoreCase.checked;
    var norms = new Array(lines.length);
    var lens = new Array(lines.length);
    var byExact = new Map();
    // length buckets for candidate pruning
    var byLen = new Map();
    for (var i = 0; i < lines.length; i++) {
      var n = ic ? lines[i].toLowerCase() : lines[i];
      norms[i] = n;
      lens[i] = n.length;
      if (!byExact.has(n)) byExact.set(n, i);
      var L0 = n.length;
      if (!byLen.has(L0)) byLen.set(L0, []);
      byLen.get(L0).push(i);
    }
    return { lines: lines, norms: norms, lens: lens, byExact: byExact, byLen: byLen };
  }

  function candidateIndices(prepB, na, maxDist) {
    // Collect B indices with length in [len-maxDist, len+maxDist]
    var len = na.length;
    var out = [];
    var lo = len - maxDist;
    if (lo < 0) lo = 0;
    var hi = len + maxDist;
    for (var L0 = lo; L0 <= hi; L0++) {
      var bucket = prepB.byLen.get(L0);
      if (!bucket) continue;
      for (var i = 0; i < bucket.length; i++) out.push(bucket[i]);
    }
    return out;
  }

  function bestMatch(na, prepB, threshold) {
    // Exact first
    if (prepB.byExact.has(na)) {
      var ei = prepB.byExact.get(na);
      return { score: 1, bi: ei, b: prepB.lines[ei] };
    }
    var maxLenGuess = na.length;
    var maxDist = Math.floor((1 - threshold) * Math.max(maxLenGuess, 1) + 1e-9);
    // expand slightly: actual maxLen depends on partner
    maxDist = Math.floor((1 - threshold) * (na.length + maxDist) + 1e-9);

    var cands = candidateIndices(prepB, na, maxDist);
    var bestScore = 0;
    var bestBi = -1;
    for (var c = 0; c < cands.length; c++) {
      var bi = cands[c];
      var s = similarityBounded(na, prepB.norms[bi], threshold);
      if (s > bestScore) {
        bestScore = s;
        bestBi = bi;
        if (s === 1) break;
      }
    }
    if (bestBi < 0) return { score: 0, bi: -1, b: null };
    return { score: bestScore, bi: bestBi, b: prepB.lines[bestBi] };
  }

  function run() {
    if (running) return;
    running = true;
    L.setBusy(btnRun, true);
    if (meta) meta.textContent = "Đang xử lý…";

    L.nextFrame()
      .then(function () {
        var opts = {
          trim: trimLines && trimLines.checked,
          dropEmpty: dropEmpty && dropEmpty.checked,
        };
        var aLines = L.parseLines(aEl.value, opts);
        var bLines = L.parseLines(bEl.value, opts);
        var threshold = thresholdEl ? Number(thresholdEl.value) / 100 : 0.7;
        var mode = modeEl ? modeEl.value : "best";

        if (!aLines.length || !bLines.length) {
          fullResult = "";
          outEl.value = "";
          if (meta) {
            meta.textContent =
              "Cần ≥1 dòng mỗi list. A:" +
              aLines.length +
              " B:" +
              bLines.length;
          }
          return;
        }

        var prepA = prepare(aLines);
        var prepB = prepare(bLines);
        var rows = [];
        var CHUNK = 80;

        function processBest(fromA) {
          // fromA true: each A -> best B
          var src = fromA ? prepA : prepB;
          var other = fromA ? prepB : prepA;
          return L.forChunked(
            src.lines.length,
            CHUNK,
            function (i) {
              var m = bestMatch(src.norms[i], other, threshold);
              if (m.score >= threshold) {
                rows.push({
                  score: m.score,
                  a: fromA ? src.lines[i] : m.b,
                  b: fromA ? m.b : src.lines[i],
                });
              }
            },
            function (done, total) {
              if (meta && done % (CHUNK * 4) < CHUNK) {
                meta.textContent =
                  "Đang xử lý… " +
                  Math.round((done / total) * 100) +
                  "%";
              }
            }
          );
        }

        function processAll() {
          // chunk by A rows
          return L.forChunked(
            prepA.lines.length,
            Math.max(5, Math.floor(CHUNK / 2)),
            function (ai) {
              var na = prepA.norms[ai];
              if (prepB.byExact.has(na)) {
                rows.push({
                  score: 1,
                  a: prepA.lines[ai],
                  b: prepB.lines[prepB.byExact.get(na)],
                });
                return;
              }
              var maxDist = Math.floor(
                (1 - threshold) * (na.length + 20) + 1e-9
              );
              var cands = candidateIndices(prepB, na, maxDist);
              for (var c = 0; c < cands.length; c++) {
                var bi = cands[c];
                var s = similarityBounded(na, prepB.norms[bi], threshold);
                if (s >= threshold) {
                  rows.push({
                    score: s,
                    a: prepA.lines[ai],
                    b: prepB.lines[bi],
                  });
                }
              }
            },
            function (done, total) {
              if (meta) {
                meta.textContent =
                  "Đang xử lý… " + Math.round((done / total) * 100) + "%";
              }
            }
          );
        }

        function processUnmatched(fromA) {
          var src = fromA ? prepA : prepB;
          var other = fromA ? prepB : prepA;
          return L.forChunked(
            src.lines.length,
            CHUNK,
            function (i) {
              var m = bestMatch(src.norms[i], other, threshold);
              if (m.score < threshold) {
                rows.push({
                  score: m.score,
                  a: fromA ? src.lines[i] : "—",
                  b: fromA ? "—" : src.lines[i],
                  unmatched: true,
                });
              }
            },
            function (done, total) {
              if (meta) {
                meta.textContent =
                  "Đang xử lý… " + Math.round((done / total) * 100) + "%";
              }
            }
          );
        }

        var p;
        if (mode === "best") p = processBest(true);
        else if (mode === "all") p = processAll();
        else if (mode === "unmatched-a") p = processUnmatched(true);
        else p = processUnmatched(false);

        return p.then(function () {
          rows.sort(function (x, y) {
            return y.score - x.score;
          });

          var lines = new Array(rows.length);
          for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            if (row.unmatched) {
              if (row.a !== "—") {
                lines[r] = pct(row.score) + "%\t[A only]\t" + row.a;
              } else {
                lines[r] = pct(row.score) + "%\t[B only]\t" + row.b;
              }
            } else {
              lines[r] = pct(row.score) + "%\t" + row.a + "\t≈\t" + row.b;
            }
          }

          fullResult = lines.join("\n");
          var capped = L.joinCapped(lines, L.RENDER_LINES_MAX);
          outEl.value = capped.text;
          if (meta) {
            meta.textContent =
              "Ngưỡng ≥ " +
              Math.round(threshold * 100) +
              "% · Khớp: " +
              L.formatCount(rows.length) +
              " · A:" +
              L.formatCount(aLines.length) +
              " B:" +
              L.formatCount(bLines.length) +
              (capped.truncated
                ? " · UI:" + L.formatCount(capped.shown) + " dòng (Copy = full)"
                : "");
          }
        });
      })
      .catch(function (e) {
        if (meta) meta.textContent = "Lỗi: " + (e && e.message ? e.message : e);
      })
      .then(function () {
        running = false;
        L.setBusy(btnRun, false, "Chạy");
      });
  }

  function syncThresholdLabel() {
    if (thresholdEl && thresholdVal) {
      thresholdVal.textContent = thresholdEl.value + "%";
    }
  }

  function maybeAuto() {
    // Fuzzy is expensive — only auto on small inputs
    var small =
      (aEl.value.length + bEl.value.length < 80000) &&
      L.shouldAutoRun(aEl.value, bEl.value);
    if (small) run();
    else if (meta && !running) {
      meta.textContent = "Dataset lớn — chỉnh option rồi bấm «Chạy».";
    }
  }

  if (thresholdEl) {
    thresholdEl.addEventListener("input", function () {
      syncThresholdLabel();
    });
  }
  if (btnRun) btnRun.addEventListener("click", run);

  // No auto on every keystroke for fuzzy by default on large; light debounce for small
  var debounced = L.debounce(maybeAuto, 500);
  aEl.addEventListener("input", debounced);
  bEl.addEventListener("input", debounced);
  [ignoreCase, trimLines, dropEmpty, modeEl].forEach(function (el) {
    if (el) el.addEventListener("change", maybeAuto);
  });
  if (thresholdEl) {
    thresholdEl.addEventListener("change", maybeAuto);
  }

  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      var text = fullResult || outEl.value;
      navigator.clipboard.writeText(text).then(function () {
        btnCopy.textContent = "Đã copy";
        setTimeout(function () {
          btnCopy.textContent = "Copy";
        }, 1200);
      });
    });

  if (btnClear)
    btnClear.addEventListener("click", function () {
      aEl.value = "";
      bEl.value = "";
      outEl.value = "";
      fullResult = "";
      if (meta) meta.textContent = "";
    });

  syncThresholdLabel();
  if (meta) meta.textContent = "Dán list rồi bấm Chạy (tối ưu cho dataset lớn).";
})();
