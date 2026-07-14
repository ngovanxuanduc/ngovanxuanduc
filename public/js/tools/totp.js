/**
 * Multi-key TOTP (RFC 6238) from Base32 secrets or otpauth:// — offline Web Crypto.
 */
(function () {
  "use strict";

  var secretEl = document.getElementById("totp-secret");
  var digitsEl = document.getElementById("totp-digits");
  var periodEl = document.getElementById("totp-period");
  var algoEl = document.getElementById("totp-algo");
  var metaEl = document.getElementById("totp-meta");
  var listEl = document.getElementById("totp-list");
  var btnRun = document.getElementById("totp-run");
  var btnCopyAll = document.getElementById("totp-copy-all");
  var btnClear = document.getElementById("totp-clear");

  if (!secretEl || !listEl) return;

  var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  /** Circumference of ring r=15.5 in viewBox 0 0 36 36 */
  var RING_C = 2 * Math.PI * 15.5;

  var rafId = 0;
  var entries = []; // { label, secret, secretBytes, digits, period, algo, line, error? }
  var lastResults = []; // { code, label, secret, error? }
  var rowEls = [];
  var codeCache = []; // last code string per index
  var lastCounter = []; // last TOTP counter used per index
  var genSeq = 0;
  var refreshing = false;

  function setMeta(msg) {
    if (metaEl) metaEl.textContent = msg || "";
  }

  /** Visual feedback on copy — button label + flash on code/card. */
  function flashCopied(btn, card, codeEl, okLabel) {
    okLabel = okLabel || "Đã copy";
    if (btn) {
      if (btn._copyReset) clearTimeout(btn._copyReset);
      var prev = btn.getAttribute("data-label") || btn.textContent || "Copy";
      if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", prev);
      btn.textContent = okLabel;
      btn.classList.add("is-copied");
      btn._copyReset = setTimeout(function () {
        btn.textContent = btn.getAttribute("data-label") || "Copy";
        btn.classList.remove("is-copied");
        btn._copyReset = null;
      }, 1400);
    }
    if (card) {
      card.classList.remove("is-copied-flash");
      // reflow so animation restarts on rapid re-clicks
      void card.offsetWidth;
      card.classList.add("is-copied-flash");
      if (card._flashReset) clearTimeout(card._flashReset);
      card._flashReset = setTimeout(function () {
        card.classList.remove("is-copied-flash");
        card._flashReset = null;
      }, 700);
    }
    if (codeEl) {
      codeEl.classList.remove("is-copied-pop");
      void codeEl.offsetWidth;
      codeEl.classList.add("is-copied-pop");
      if (codeEl._popReset) clearTimeout(codeEl._popReset);
      codeEl._popReset = setTimeout(function () {
        codeEl.classList.remove("is-copied-pop");
        codeEl._popReset = null;
      }, 500);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeAlgo(a) {
    var s = String(a || "SHA-1")
      .toUpperCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "");
    if (s === "SHA1") return "SHA-1";
    if (s === "SHA256") return "SHA-256";
    if (s === "SHA512") return "SHA-512";
    if (s === "SHA-1" || s === "SHA-256" || s === "SHA-512") return s;
    return "SHA-1";
  }

  function normalizeSecret(input) {
    return String(input || "")
      .toUpperCase()
      .replace(/[\s=\-]/g, "");
  }

  /** Base32 decode (RFC 4648), ignore spaces/padding; case-insensitive. */
  function base32Decode(input) {
    var s = normalizeSecret(input);
    if (!s) throw new Error("Secret trống");
    var bits = 0;
    var value = 0;
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var idx = B32.indexOf(s.charAt(i));
      if (idx === -1) {
        throw new Error("Không phải Base32 (ký tự: " + s.charAt(i) + ")");
      }
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    if (!out.length) throw new Error("Secret Base32 không hợp lệ");
    return new Uint8Array(out);
  }

  function parseOtpauth(raw) {
    var url;
    try {
      url = new URL(raw.trim());
    } catch (e) {
      throw new Error("URI otpauth không hợp lệ");
    }
    if (url.protocol !== "otpauth:") throw new Error("Chỉ hỗ trợ otpauth://");
    var type = (url.hostname || "").toLowerCase();
    if (type === "hotp") throw new Error("HOTP chưa hỗ trợ — chỉ TOTP");
    if (type && type !== "totp") {
      throw new Error("Loại " + type + " chưa hỗ trợ (cần totp)");
    }

    var params = url.searchParams;
    var secret = params.get("secret");
    if (!secret) throw new Error("otpauth thiếu secret");

    var digits = parseInt(params.get("digits") || "6", 10);
    var period = parseInt(params.get("period") || "30", 10);
    var algo = normalizeAlgo(params.get("algorithm") || params.get("algo") || "SHA1");
    var path = "";
    try {
      path = decodeURIComponent((url.pathname || "").replace(/^\//, ""));
    } catch (e2) {
      path = (url.pathname || "").replace(/^\//, "");
    }
    var issuer = params.get("issuer") || "";
    var label = path || issuer || "otpauth";

    return {
      secret: secret,
      digits: digits,
      period: period,
      algo: algo,
      label: label,
    };
  }

  /**
   * Parse one line into { label, secretRaw } or null if blank.
   */
  function splitLine(line) {
    var t = line.trim();
    if (!t) return null;
    if (/^otpauth:\/\//i.test(t)) {
      return { label: "", secretRaw: t, isOtpauth: true };
    }

    var m = t.match(/^(.+?)\s*[|\t]\s*(.+)$/);
    if (m) {
      return { label: m[1].trim(), secretRaw: m[2].trim(), isOtpauth: false };
    }

    m = t.match(/^(.+?):\s+(.+)$/);
    if (m && !/^[A-Z2-7=\s\-]+$/i.test(m[1])) {
      return { label: m[1].trim(), secretRaw: m[2].trim(), isOtpauth: false };
    }

    m = t.match(/^(.+?)\s+=\s+(.+)$/);
    if (m) {
      return { label: m[1].trim(), secretRaw: m[2].trim(), isOtpauth: false };
    }

    return { label: "", secretRaw: t, isOtpauth: false };
  }

  function defaults() {
    return {
      digits: Math.min(10, Math.max(6, parseInt(digitsEl.value, 10) || 6)),
      period: Math.min(300, Math.max(5, parseInt(periodEl.value, 10) || 30)),
      algo: normalizeAlgo(algoEl.value),
    };
  }

  function parseEntry(line, index) {
    var def = defaults();
    var split = splitLine(line);
    if (!split) return null;

    try {
      var label = split.label;
      var secretRaw = split.secretRaw;
      var digits = def.digits;
      var period = def.period;
      var algo = def.algo;

      if (split.isOtpauth || /^otpauth:\/\//i.test(secretRaw)) {
        var p = parseOtpauth(secretRaw);
        secretRaw = p.secret;
        digits = Math.min(10, Math.max(6, p.digits));
        period = Math.min(300, Math.max(5, p.period));
        algo = p.algo;
        if (!label) label = p.label;
      }

      var secret = normalizeSecret(secretRaw);
      var secretBytes = base32Decode(secret);
      if (!label) label = "Key " + (index + 1);

      return {
        label: label,
        secret: secret,
        secretBytes: secretBytes,
        digits: digits,
        period: period,
        algo: algo,
        line: index + 1,
        error: null,
      };
    } catch (e) {
      var badSecret = "";
      try {
        if (split.isOtpauth) {
          var op = parseOtpauth(split.secretRaw);
          badSecret = normalizeSecret(op.secret);
        } else {
          badSecret = normalizeSecret(split.secretRaw);
        }
      } catch (ignore) {
        badSecret = String(split.secretRaw || "").trim();
      }
      return {
        label: split.label || "Key " + (index + 1),
        secret: badSecret,
        secretBytes: null,
        digits: def.digits,
        period: def.period,
        algo: def.algo,
        line: index + 1,
        error: e && e.message ? e.message : String(e),
      };
    }
  }

  function parseAll() {
    var text = secretEl.value || "";
    var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var e = parseEntry(lines[i], i);
      if (e) out.push(e);
    }
    return out;
  }

  function counterBytes(counter) {
    var buf = new ArrayBuffer(8);
    var view = new DataView(buf);
    var high = Math.floor(counter / 0x100000000);
    var low = counter >>> 0;
    view.setUint32(0, high);
    view.setUint32(4, low);
    return new Uint8Array(buf);
  }

  function hmacSha(algo, keyBytes, msgBytes) {
    return crypto.subtle
      .importKey("raw", keyBytes, { name: "HMAC", hash: algo }, false, ["sign"])
      .then(function (key) {
        return crypto.subtle.sign("HMAC", key, msgBytes);
      })
      .then(function (sig) {
        return new Uint8Array(sig);
      });
  }

  function dynamicTruncate(hmac, digits) {
    var offset = hmac[hmac.length - 1] & 0x0f;
    var bin =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    var mod = Math.pow(10, digits);
    return String(bin % mod).padStart(digits, "0");
  }

  function formatCode(code) {
    if (code.length === 6) return code.slice(0, 3) + " " + code.slice(3);
    if (code.length === 8) return code.slice(0, 4) + " " + code.slice(4);
    if (code.length === 7) return code.slice(0, 3) + " " + code.slice(3);
    return code;
  }

  function generateCode(c, counter) {
    return hmacSha(c.algo, c.secretBytes, counterBytes(counter)).then(function (hmac) {
      return dynamicTruncate(hmac, c.digits);
    });
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function ringHtml() {
    return (
      '<div class="totp-ring" aria-hidden="true">' +
      '<svg class="totp-ring__svg" viewBox="0 0 36 36" width="44" height="44">' +
      '<circle class="totp-ring__track" cx="18" cy="18" r="15.5" fill="none" stroke-width="3" />' +
      '<circle class="totp-ring__prog" cx="18" cy="18" r="15.5" fill="none" stroke-width="3" ' +
      'stroke-linecap="round" transform="rotate(-90 18 18)" ' +
      'stroke-dasharray="' +
      RING_C.toFixed(3) +
      '" stroke-dashoffset="0" />' +
      "</svg>" +
      '<span class="totp-ring__num">—</span>' +
      "</div>"
    );
  }

  function buildRows(list) {
    listEl.innerHTML = "";
    rowEls = [];
    codeCache = new Array(list.length);
    lastCounter = new Array(list.length);
    lastResults = new Array(list.length);

    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var card = document.createElement("div");
      card.className = "totp-card" + (e.error ? " totp-card--error" : "");
      card.setAttribute("data-i", String(i));

      var secretLine = e.secret
        ? '<div class="totp-card__key" title="' +
          escapeHtml(e.secret) +
          '"><span class="totp-card__key-label">KEY</span> ' +
          '<code class="totp-card__key-val">' +
          escapeHtml(e.secret) +
          "</code></div>"
        : "";

      card.innerHTML =
        '<div class="totp-card__head">' +
        '<span class="totp-card__label" title="' +
        escapeHtml(e.label) +
        '">' +
        escapeHtml(e.label) +
        "</span>" +
        '<span class="totp-card__meta">' +
        (e.error
          ? "dòng " + e.line
          : e.digits + " · " + e.period + "s · " + e.algo) +
        "</span>" +
        "</div>" +
        '<div class="totp-card__body">' +
        '<div class="totp-card__code" aria-live="polite">' +
        (e.error ? "—" : "······") +
        "</div>" +
        '<div class="totp-card__aside">' +
        ringHtml() +
        '<button type="button" class="btn btn--ghost btn--sm totp-card__copy" data-i="' +
        i +
        '"' +
        (e.error ? " disabled" : "") +
        ">Copy</button>" +
        "</div>" +
        "</div>" +
        secretLine +
        (e.error
          ? '<div class="totp-card__foot"><span class="totp-card__timer">' +
            escapeHtml(e.error) +
            "</span></div>"
          : "");

      listEl.appendChild(card);
      rowEls.push({
        root: card,
        code: card.querySelector(".totp-card__code"),
        ring: card.querySelector(".totp-ring"),
        prog: card.querySelector(".totp-ring__prog"),
        num: card.querySelector(".totp-ring__num"),
        copy: card.querySelector(".totp-card__copy"),
      });

      lastResults[i] = {
        label: e.label,
        secret: e.secret || "",
        code: "",
        error: e.error || null,
      };
    }

    listEl.querySelectorAll(".totp-card__copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-i"), 10);
        var r = lastResults[idx];
        var row = rowEls[idx];
        if (!r || !r.code) {
          setMeta("Chưa có code");
          return;
        }
        navigator.clipboard.writeText(r.code).then(
          function () {
            flashCopied(btn, row && row.root, row && row.code, "Đã copy ✓");
            setMeta("Đã copy " + r.label + ": " + r.code);
          },
          function () {
            setMeta("Copy thất bại");
            if (btn) {
              btn.classList.add("is-copy-fail");
              setTimeout(function () {
                btn.classList.remove("is-copy-fail");
              }, 900);
            }
          }
        );
      });
    });
  }

  function paintRing(row, period, nowMs) {
    if (!row || !row.prog) return;
    var periodMs = period * 1000;
    var elapsedInPeriod = nowMs % periodMs;
    var remainMs = periodMs - elapsedInPeriod;
    var frac = remainMs / periodMs; // 1 → 0
    var offset = RING_C * (1 - frac);
    row.prog.setAttribute("stroke-dashoffset", String(offset));

    var remainSec = Math.ceil(remainMs / 1000);
    if (row.num) row.num.textContent = String(remainSec);

    var urgent = remainMs <= 5000;
    if (row.ring) row.ring.classList.toggle("is-urgent", urgent);
    if (row.prog) row.prog.classList.toggle("is-urgent", urgent);
  }

  function paintCode(i, code) {
    var row = rowEls[i];
    if (!row || !row.code) return;
    codeCache[i] = code;
    row.code.textContent = formatCode(code);
    if (lastResults[i]) {
      lastResults[i].code = code;
      lastResults[i].error = null;
    }
  }

  /** Refresh TOTP codes only when the time-step counter changes. */
  function refreshCodesIfNeeded(nowMs) {
    if (!entries.length || refreshing) return;
    var need = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.error || !e.secretBytes) continue;
      var counter = Math.floor(nowMs / 1000 / e.period);
      if (lastCounter[i] !== counter) {
        need.push({ i: i, e: e, counter: counter });
      }
    }
    if (!need.length) return;

    refreshing = true;
    var seq = ++genSeq;
    Promise.all(
      need.map(function (item) {
        return generateCode(item.e, item.counter).then(function (code) {
          return { i: item.i, counter: item.counter, code: code };
        });
      })
    )
      .then(function (results) {
        if (seq !== genSeq) return;
        for (var j = 0; j < results.length; j++) {
          var r = results[j];
          lastCounter[r.i] = r.counter;
          paintCode(r.i, r.code);
        }
        var ok = 0;
        var err = 0;
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].error) err++;
          else if (codeCache[k]) ok++;
        }
        setMeta(ok + " code" + (err ? " · " + err + " lỗi" : "") + " · auto refresh");
      })
      .catch(function (e) {
        setMeta("Lỗi: " + (e && e.message ? e.message : e));
      })
      .then(function () {
        refreshing = false;
      });
  }

  function frame(nowMs) {
    if (!entries.length) return;
    if (nowMs == null) nowMs = Date.now();

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var row = rowEls[i];
      if (!row) continue;
      if (e.error) continue;
      paintRing(row, e.period, nowMs);
    }

    refreshCodesIfNeeded(nowMs);
    rafId = requestAnimationFrame(function (t) {
      // use wall clock for period sync, not rAF timestamp
      frame(Date.now());
    });
  }

  function startFromInput() {
    stopLoop();
    genSeq++;
    refreshing = false;

    var list = parseAll();
    if (!list.length) {
      entries = [];
      lastResults = [];
      rowEls = [];
      codeCache = [];
      lastCounter = [];
      listEl.hidden = true;
      listEl.innerHTML = "";
      setMeta("Nhập ít nhất 1 KEY");
      return;
    }

    entries = list;
    buildRows(list);
    listEl.hidden = false;

    // initial ring paint + force code gen
    var now = Date.now();
    for (var i = 0; i < entries.length; i++) {
      lastCounter[i] = undefined;
      if (entries[i].error) continue;
      paintRing(rowEls[i], entries[i].period, now);
    }
    refreshCodesIfNeeded(now);
    frame(now);
  }

  if (btnRun) btnRun.addEventListener("click", startFromInput);

  var debounce = null;
  secretEl.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      var v = (secretEl.value || "").trim();
      if (v.length >= 8) startFromInput();
      else if (!v) {
        stopLoop();
        entries = [];
        lastResults = [];
        rowEls = [];
        codeCache = [];
        lastCounter = [];
        listEl.hidden = true;
        listEl.innerHTML = "";
        setMeta("");
      }
    }, 450);
  });

  function onOptChange() {
    if (entries.length || (secretEl.value || "").trim()) startFromInput();
  }
  if (digitsEl) digitsEl.addEventListener("change", onOptChange);
  if (periodEl) periodEl.addEventListener("change", onOptChange);
  if (algoEl) algoEl.addEventListener("change", onOptChange);

  if (btnCopyAll) {
    btnCopyAll.setAttribute("data-label", btnCopyAll.textContent || "Copy tất cả");
    btnCopyAll.addEventListener("click", function () {
      var lines = [];
      for (var i = 0; i < lastResults.length; i++) {
        var r = lastResults[i];
        if (r && r.code && !r.error) {
          lines.push(r.label + "\t" + r.code + (r.secret ? "\t" + r.secret : ""));
        }
      }
      if (!lines.length) {
        setMeta("Chưa có code để copy");
        return;
      }
      navigator.clipboard.writeText(lines.join("\n")).then(
        function () {
          flashCopied(btnCopyAll, null, null, "Đã copy ✓");
          // brief flash on every successful card
          for (var i = 0; i < rowEls.length; i++) {
            if (lastResults[i] && lastResults[i].code && !lastResults[i].error) {
              flashCopied(null, rowEls[i].root, rowEls[i].code);
            }
          }
          setMeta("Đã copy " + lines.length + " code");
        },
        function () {
          setMeta("Copy thất bại");
          btnCopyAll.classList.add("is-copy-fail");
          setTimeout(function () {
            btnCopyAll.classList.remove("is-copy-fail");
          }, 900);
        }
      );
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      stopLoop();
      entries = [];
      lastResults = [];
      rowEls = [];
      codeCache = [];
      lastCounter = [];
      secretEl.value = "";
      listEl.hidden = true;
      listEl.innerHTML = "";
      setMeta("");
      secretEl.focus();
    });
  }

  window.addEventListener("beforeunload", stopLoop);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopLoop();
    } else if (entries.length) {
      // resume smooth loop + force recompute
      for (var i = 0; i < lastCounter.length; i++) lastCounter[i] = undefined;
      frame(Date.now());
    }
  });
})();
