/**
 * Shared helpers for string tools — tuned for large inputs.
 * Entry guards are O(1); hot loops stay allocation-light.
 */
(function (global) {
  "use strict";

  /** Auto-run on input only if under these limits */
  var AUTO_LINES = 25000;
  var AUTO_CHARS = 1.5e6;
  var RENDER_LINES_MAX = 4000;

  function asString(text) {
    if (text == null) return "";
    return typeof text === "string" ? text : String(text);
  }

  function splitLines(text) {
    var s = asString(text);
    if (!s) return [];
    // Normalize CRLF once; split is native & fast
    if (s.indexOf("\r") !== -1) {
      s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }
    if (s.length === 0) return [];
    return s.split("\n");
  }

  function parseLines(text, opts) {
    opts = opts || {};
    var lines = splitLines(text);
    var trim = !!opts.trim;
    var dropEmpty = !!opts.dropEmpty;
    if (!trim && !dropEmpty) return lines;
    var out = new Array(lines.length);
    var n = 0;
    for (var i = 0; i < lines.length; i++) {
      var v = trim ? lines[i].trim() : lines[i];
      if (dropEmpty && v === "") continue;
      out[n++] = v;
    }
    out.length = n;
    return out;
  }

  function shouldAutoRun(textA, textB, textC) {
    var chars =
      (textA ? asString(textA).length : 0) +
      (textB ? asString(textB).length : 0) +
      (textC ? asString(textC).length : 0);
    if (chars > AUTO_CHARS) return false;
    function countNL(t) {
      if (!t) return 0;
      t = asString(t);
      var c = 1;
      for (var i = 0; i < t.length; i++) if (t.charCodeAt(i) === 10) c++;
      return c;
    }
    return countNL(textA) + countNL(textB) + countNL(textC) <= AUTO_LINES;
  }

  function debounce(fn, ms) {
    var t = null;
    if (typeof fn !== "function") {
      return function () {};
    }
    ms = ms > 0 ? ms : 0;
    var wrapped = function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
    wrapped.cancel = function () {
      clearTimeout(t);
    };
    return wrapped;
  }

  /** Yield to browser so UI stays responsive */
  function nextFrame() {
    return new Promise(function (resolve) {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () {
          setTimeout(resolve, 0);
        });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Process items in chunks; fn(item, index) called per item.
   * Returns Promise.
   */
  function mapChunked(items, chunkSize, fn, onProgress) {
    if (!items || typeof items.length !== "number" || !items.length) {
      return Promise.resolve([]);
    }
    chunkSize = chunkSize > 0 ? chunkSize | 0 : 256;
    if (typeof fn !== "function") {
      return Promise.reject(new Error("mapChunked: fn required"));
    }
    return new Promise(function (resolve, reject) {
      var i = 0;
      var len = items.length;
      var results = new Array(len);
      function step() {
        var end = Math.min(i + chunkSize, len);
        try {
          for (; i < end; i++) {
            results[i] = fn(items[i], i);
          }
        } catch (e) {
          reject(e);
          return;
        }
        if (onProgress) onProgress(i, len);
        if (i >= len) {
          resolve(results);
          return;
        }
        nextFrame().then(step);
      }
      step();
    });
  }

  function forChunked(length, chunkSize, fn, onProgress) {
    length = Number(length) || 0;
    if (length <= 0) return Promise.resolve();
    chunkSize = chunkSize > 0 ? chunkSize | 0 : 256;
    if (typeof fn !== "function") {
      return Promise.reject(new Error("forChunked: fn required"));
    }
    return new Promise(function (resolve, reject) {
      var i = 0;
      function step() {
        var end = Math.min(i + chunkSize, length);
        try {
          for (; i < end; i++) fn(i);
        } catch (e) {
          reject(e);
          return;
        }
        if (onProgress) onProgress(i, length);
        if (i >= length) {
          resolve();
          return;
        }
        nextFrame().then(step);
      }
      step();
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /** Cap rendered rows; return { text, truncated, total, shown } */
  function joinCapped(lines, max) {
    max = max || RENDER_LINES_MAX;
    if (!lines || typeof lines.length !== "number" || !lines.length) {
      return { text: "", truncated: false, total: 0, shown: 0 };
    }
    var total = lines.length;
    if (total <= max) {
      return { text: lines.join("\n"), truncated: false, total: total, shown: total };
    }
    var slice = lines.slice(0, max);
    slice.push(
      "",
      "… truncated: showing " + max + " / " + total + " lines (copy still full if tool stores full result)"
    );
    return { text: slice.join("\n"), truncated: true, total: total, shown: max };
  }

  function formatCount(n) {
    n = Number(n);
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("en-US");
  }

  function setBusy(btn, busy, labelIdle) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset._label = btn.textContent;
      btn.textContent = "Đang xử lý…";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset._label || labelIdle || "Chạy";
    }
  }

  /** Null-safe click binding (id string or element). */
  function onClick(idOrEl, fn) {
    var el =
      typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
    if (el && typeof fn === "function") el.addEventListener("click", fn);
    return el;
  }

  global.ToolLib = {
    AUTO_LINES: AUTO_LINES,
    AUTO_CHARS: AUTO_CHARS,
    RENDER_LINES_MAX: RENDER_LINES_MAX,
    asString: asString,
    splitLines: splitLines,
    parseLines: parseLines,
    shouldAutoRun: shouldAutoRun,
    debounce: debounce,
    nextFrame: nextFrame,
    mapChunked: mapChunked,
    forChunked: forChunked,
    escapeHtml: escapeHtml,
    joinCapped: joinCapped,
    formatCount: formatCount,
    setBusy: setBusy,
    onClick: onClick,
  };
})(typeof window !== "undefined" ? window : globalThis);
