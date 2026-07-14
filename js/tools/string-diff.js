(function () {
  var aEl = document.getElementById("diff-a");
  var bEl = document.getElementById("diff-b");
  var out = document.getElementById("diff-out");
  var meta = document.getElementById("diff-meta");
  var ignoreWs = document.getElementById("diff-ignore-ws");
  var btn = document.getElementById("diff-run");
  var btnClear = document.getElementById("diff-clear");
  if (!aEl || !bEl || !out || !window.ToolLib) return;

  var L = ToolLib;
  var running = false;
  var MAX_RENDER = 3000;
  var MYERS_MAX = 12000; // max(N+M) for full Myers on middle

  function normalizeLine(line, ignore) {
    return ignore ? line.replace(/[ \t]+/g, " ").trim() : line;
  }

  /** Myers O(ND) — only for moderate-sized segments */
  function myersDiff(a, b) {
    var N = a.length;
    var M = b.length;
    if (!N && !M) return [];
    if (!N) {
      return b.map(function (t) {
        return { type: "add", text: t };
      });
    }
    if (!M) {
      return a.map(function (t) {
        return { type: "del", text: t };
      });
    }

    var max = N + M;
    var offset = max;
    var v = new Int32Array(2 * max + 1);
    for (var z = 0; z < v.length; z++) v[z] = -1;
    v[offset + 1] = 0;
    var trace = [];

    var d, k, x, y;
    outer: for (d = 0; d <= max; d++) {
      trace.push(Int32Array.from(v));
      for (k = -d; k <= d; k += 2) {
        if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
          x = v[offset + k + 1];
        } else {
          x = v[offset + k - 1] + 1;
        }
        y = x - k;
        while (x < N && y < M && a[x] === b[y]) {
          x++;
          y++;
        }
        v[offset + k] = x;
        if (x >= N && y >= M) break outer;
      }
    }

    var opsRev = [];
    x = N;
    y = M;
    for (d = trace.length - 1; d > 0; d--) {
      var vPrev = trace[d - 1];
      k = x - y;
      var prevK =
        k === -d || (k !== d && vPrev[offset + k - 1] < vPrev[offset + k + 1])
          ? k + 1
          : k - 1;
      var prevX = vPrev[offset + prevK];
      var prevY = prevX - prevK;
      while (x > prevX && y > prevY) {
        opsRev.push({ type: "same", text: a[x - 1] });
        x--;
        y--;
      }
      if (x === prevX) {
        opsRev.push({ type: "add", text: b[y - 1] });
        y = prevY;
      } else {
        opsRev.push({ type: "del", text: a[x - 1] });
        x = prevX;
      }
      // continue from prev
      x = prevX;
      y = prevY;
    }
    while (x > 0 && y > 0) {
      opsRev.push({ type: "same", text: a[x - 1] });
      x--;
      y--;
    }
    while (x > 0) {
      opsRev.push({ type: "del", text: a[x - 1] });
      x--;
    }
    while (y > 0) {
      opsRev.push({ type: "add", text: b[y - 1] });
      y--;
    }
    opsRev.reverse();
    return opsRev;
  }

  /**
   * Fast path for large lists: order-preserving multiset matching.
   * O(n+m) — scales to 100k+ lines (not always minimal edit length).
   */
  function greedyDiff(a, b) {
    var map = new Map();
    var j;
    for (j = 0; j < b.length; j++) {
      var q = map.get(b[j]);
      if (!q) {
        q = [];
        map.set(b[j], q);
      }
      q.push(j);
    }
    map.forEach(function (q) {
      q.ptr = 0;
    });

    var matchA = new Int32Array(a.length);
    var i;
    for (i = 0; i < a.length; i++) matchA[i] = -1;
    var usedB = new Uint8Array(b.length);
    var lastJ = -1;

    for (i = 0; i < a.length; i++) {
      q = map.get(a[i]);
      if (!q) continue;
      var p = q.ptr;
      while (p < q.length && (usedB[q[p]] || q[p] <= lastJ)) p++;
      if (p >= q.length) {
        q.ptr = p;
        continue;
      }
      j = q[p];
      usedB[j] = 1;
      matchA[i] = j;
      lastJ = j;
      q.ptr = p + 1;
    }

    var ops = [];
    i = 0;
    j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && matchA[i] === j) {
        ops.push({ type: "same", text: a[i] });
        i++;
        j++;
      } else if (i < a.length && (matchA[i] === -1 || matchA[i] < j)) {
        ops.push({ type: "del", text: a[i] });
        i++;
      } else if (j < b.length) {
        ops.push({ type: "add", text: b[j] });
        j++;
      } else {
        ops.push({ type: "del", text: a[i] });
        i++;
      }
    }
    return ops;
  }

  function diffLines(a, b) {
    // Trim common prefix / suffix — huge win for similar large files
    var n = a.length;
    var m = b.length;
    var start = 0;
    while (start < n && start < m && a[start] === b[start]) start++;
    var endA = n - 1;
    var endB = m - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
      endA--;
      endB--;
    }

    var prefix = [];
    var i;
    for (i = 0; i < start; i++) prefix.push({ type: "same", text: a[i] });

    var aMid = a.slice(start, endA + 1);
    var bMid = b.slice(start, endB + 1);
    var mid;
    var midSize = aMid.length + bMid.length;
    if (midSize === 0) {
      mid = [];
    } else if (midSize <= MYERS_MAX && aMid.length * bMid.length <= 4e7) {
      mid = myersDiff(aMid, bMid);
    } else {
      mid = greedyDiff(aMid, bMid);
    }

    var suffix = [];
    for (i = endA + 1; i < n; i++) suffix.push({ type: "same", text: a[i] });

    return prefix.concat(mid, suffix);
  }

  function renderOps(ops, aLen, bLen, ms, mode) {
    var adds = 0;
    var dels = 0;
    var sames = 0;
    var i;
    for (i = 0; i < ops.length; i++) {
      if (ops[i].type === "add") adds++;
      else if (ops[i].type === "del") dels++;
      else sames++;
    }

    var limit = Math.min(ops.length, MAX_RENDER);
    var parts = new Array(limit + (ops.length > MAX_RENDER ? 1 : 0));
    for (i = 0; i < limit; i++) {
      var op = ops[i];
      var mark = op.type === "add" ? "+" : op.type === "del" ? "−" : "·";
      var text = op.text.length ? L.escapeHtml(op.text) : " ";
      parts[i] =
        '<div class="diff-line diff-line--' +
        op.type +
        '"><span class="diff-line__n">' +
        (i + 1) +
        '</span><span class="diff-line__m">' +
        mark +
        '</span><span class="diff-line__t">' +
        text +
        "</span></div>";
    }
    if (ops.length > MAX_RENDER) {
      parts[limit] =
        '<div class="diff-empty">… UI ' +
        L.formatCount(MAX_RENDER) +
        " / " +
        L.formatCount(ops.length) +
        " dòng (đã diff full).</div>";
    }
    out.innerHTML = parts.join("");

    if (meta) {
      meta.textContent =
        "Giống: " +
        L.formatCount(sames) +
        " · Thêm: " +
        L.formatCount(adds) +
        " · Xóa: " +
        L.formatCount(dels) +
        " · A:" +
        L.formatCount(aLen) +
        " B:" +
        L.formatCount(bLen) +
        " · " +
        ms +
        "ms" +
        " · " +
        mode;
    }
  }

  function run() {
    if (running) return;
    running = true;
    L.setBusy(btn, true);
    if (meta) meta.textContent = "Đang diff…";

    L.nextFrame().then(function () {
      var t0 = performance.now();
      try {
        var ignore = ignoreWs && ignoreWs.checked;
        var aRaw = L.splitLines(aEl.value);
        var bRaw = L.splitLines(bEl.value);
        var aNorm = new Array(aRaw.length);
        var bNorm = new Array(bRaw.length);
        var i;
        for (i = 0; i < aRaw.length; i++) {
          aNorm[i] = normalizeLine(aRaw[i], ignore);
        }
        for (i = 0; i < bRaw.length; i++) {
          bNorm[i] = normalizeLine(bRaw[i], ignore);
        }

        if (!aNorm.length && !bNorm.length) {
          out.innerHTML =
            '<div class="diff-empty">Cả hai ô trống — không có gì để so.</div>';
          if (meta) meta.textContent = "";
          return;
        }

        // Detect mode for meta
        var n = aNorm.length;
        var m = bNorm.length;
        var start = 0;
        while (start < n && start < m && aNorm[start] === bNorm[start]) start++;
        var endA = n - 1;
        var endB = m - 1;
        while (endA >= start && endB >= start && aNorm[endA] === bNorm[endB]) {
          endA--;
          endB--;
        }
        var midSize = endA - start + 1 + (endB - start + 1);
        if (midSize < 0) midSize = 0;
        var mode =
          midSize <= MYERS_MAX ? "myers" : "fast/" + L.formatCount(n + m);

        var ops = diffLines(aNorm, bNorm);
        var ms = Math.round(performance.now() - t0);
        renderOps(ops, aNorm.length, bNorm.length, ms, mode);
      } catch (e) {
        out.innerHTML =
          '<div class="diff-empty">Lỗi: ' +
          L.escapeHtml(e && e.message ? e.message : String(e)) +
          "</div>";
      } finally {
        running = false;
        L.setBusy(btn, false, "So sánh");
      }
    });
  }

  function maybeAuto() {
    if (L.shouldAutoRun(aEl.value, bEl.value)) run();
    else if (meta) {
      meta.textContent = "Dataset lớn — bấm «So sánh» (tránh lag khi gõ).";
    }
  }

  if (btn) btn.addEventListener("click", run);
  if (btnClear)
    btnClear.addEventListener("click", function () {
      aEl.value = "";
      bEl.value = "";
      out.innerHTML =
        '<div class="diff-empty">Dán text hai bên rồi bấm So sánh.</div>';
      if (meta) meta.textContent = "";
    });

  var debounced = L.debounce(maybeAuto, 400);
  aEl.addEventListener("input", debounced);
  bEl.addEventListener("input", debounced);
  if (ignoreWs) ignoreWs.addEventListener("change", maybeAuto);

  out.innerHTML =
    '<div class="diff-empty">Dán text hai bên rồi bấm So sánh.</div>';
})();
