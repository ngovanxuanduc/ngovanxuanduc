/**
 * Password generator — crypto.getRandomValues, offline.
 */
(function () {
  "use strict";

  var lenEl = document.getElementById("pw-len");
  var nEl = document.getElementById("pw-n");
  var listEl = document.getElementById("pw-list");
  var metaEl = document.getElementById("pw-meta");
  var strengthBox = document.getElementById("pw-strength");
  var strengthFill = document.getElementById("pw-strength-fill");
  var strengthLabel = document.getElementById("pw-strength-label");
  var btnGen = document.getElementById("pw-gen");
  var btnCopy = document.getElementById("pw-copy");
  var btnClear = document.getElementById("pw-clear");
  if (!listEl) return;

  var SETS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digit: "0123456789",
    symbol: "!@#$%^&*()-_=+[]{};:,.?",
  };
  var AMBIGUOUS = /[0OIl1|]/g;

  var lastPasswords = [];

  function isChecked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function setMeta(msg) {
    if (metaEl) metaEl.textContent = msg || "";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Rejection sampling — unbiased pick from charset */
  function randChar(chars) {
    var max = Math.floor(256 / chars.length) * chars.length;
    if (max <= 0) return chars.charAt(0);
    var buf = new Uint8Array(1);
    for (;;) {
      crypto.getRandomValues(buf);
      if (buf[0] < max) return chars.charAt(buf[0] % chars.length);
    }
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var buf = new Uint8Array(1);
      var j;
      // unbiased index 0..i
      var max = Math.floor(256 / (i + 1)) * (i + 1);
      do {
        crypto.getRandomValues(buf);
      } while (buf[0] >= max);
      j = buf[0] % (i + 1);
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function activeSets() {
    var sets = [];
    if (isChecked("pw-lower")) sets.push({ id: "lower", chars: SETS.lower });
    if (isChecked("pw-upper")) sets.push({ id: "upper", chars: SETS.upper });
    if (isChecked("pw-digit")) sets.push({ id: "digit", chars: SETS.digit });
    if (isChecked("pw-symbol")) sets.push({ id: "symbol", chars: SETS.symbol });
    var dropAmb = isChecked("pw-ambiguous");
    if (dropAmb) {
      for (var i = 0; i < sets.length; i++) {
        sets[i] = {
          id: sets[i].id,
          chars: sets[i].chars.replace(AMBIGUOUS, ""),
        };
      }
      sets = sets.filter(function (s) {
        return s.chars.length > 0;
      });
    }
    return sets;
  }

  function poolFrom(sets) {
    var s = "";
    for (var i = 0; i < sets.length; i++) s += sets[i].chars;
    // unique chars (sets don't overlap normally)
    return s;
  }

  function generateOne(len, sets, requireEach) {
    var pool = poolFrom(sets);
    if (!pool) return "";
    if (requireEach && sets.length > len) {
      // can't require more classes than length
      requireEach = false;
    }
    var chars = new Array(len);
    var i = 0;
    if (requireEach) {
      for (i = 0; i < sets.length; i++) {
        chars[i] = randChar(sets[i].chars);
      }
    }
    for (; i < len; i++) {
      chars[i] = randChar(pool);
    }
    if (requireEach) shuffle(chars);
    return chars.join("");
  }

  /** Rough entropy bits = len * log2(poolSize) */
  function entropyBits(len, poolSize) {
    if (poolSize <= 1 || len <= 0) return 0;
    return len * (Math.log(poolSize) / Math.LN2);
  }

  function strengthFromBits(bits) {
    if (bits < 28) return { level: 0, label: "Rất yếu", cls: "is-weak" };
    if (bits < 36) return { level: 1, label: "Yếu", cls: "is-fair" };
    if (bits < 60) return { level: 2, label: "Vừa", cls: "is-ok" };
    if (bits < 80) return { level: 3, label: "Mạnh", cls: "is-strong" };
    return { level: 4, label: "Rất mạnh", cls: "is-best" };
  }

  function updateStrength(len, poolSize) {
    if (!strengthBox || !strengthFill || !strengthLabel) return;
    var bits = entropyBits(len, poolSize);
    var st = strengthFromBits(bits);
    strengthBox.hidden = false;
    strengthBox.className = "pw-strength " + st.cls;
    var pct = Math.min(100, Math.round((bits / 100) * 100));
    strengthFill.style.width = pct + "%";
    strengthLabel.textContent =
      st.label + " · ~" + Math.round(bits) + " bit entropy (ước lượng)";
  }

  function renderList(passwords) {
    listEl.innerHTML = "";
    lastPasswords = passwords.slice();
    if (!passwords.length) {
      listEl.innerHTML = '<p class="tool-field__hint">Chưa có mật khẩu.</p>';
      return;
    }
    for (var i = 0; i < passwords.length; i++) {
      var row = document.createElement("div");
      row.className = "pw-row";
      row.innerHTML =
        '<code class="pw-row__pass">' +
        escapeHtml(passwords[i]) +
        "</code>" +
        '<button type="button" class="btn btn--ghost btn--sm pw-row__copy" data-i="' +
        i +
        '">Copy</button>';
      listEl.appendChild(row);
    }
    listEl.querySelectorAll(".pw-row__copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-i"), 10);
        var pw = lastPasswords[idx];
        if (!pw) return;
        if (window.ToolLib) ToolLib.copyText(pw, btn);
        else if (navigator.clipboard) navigator.clipboard.writeText(pw);
      });
    });
  }

  function generate() {
    var sets = activeSets();
    if (!sets.length) {
      setMeta("Chọn ít nhất 1 loại ký tự");
      return;
    }
    var len = Math.min(128, Math.max(4, parseInt(lenEl && lenEl.value, 10) || 16));
    var n = Math.min(100, Math.max(1, parseInt(nEl && nEl.value, 10) || 1));
    if (lenEl) lenEl.value = String(len);
    if (nEl) nEl.value = String(n);

    var requireEach = isChecked("pw-require");
    var pool = poolFrom(sets);
    var list = new Array(n);
    for (var i = 0; i < n; i++) {
      list[i] = generateOne(len, sets, requireEach);
    }
    renderList(list);
    updateStrength(len, pool.length);
    setMeta(n + " × " + len + " · pool " + pool.length + " ký tự");
  }

  function setPresetActive(name) {
    document.querySelectorAll("[data-pw-preset]").forEach(function (btn) {
      var on = btn.getAttribute("data-pw-preset") === name;
      btn.classList.toggle("btn--primary", on);
      btn.classList.toggle("btn--ghost", !on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function applyPreset(p) {
    var lower = document.getElementById("pw-lower");
    var upper = document.getElementById("pw-upper");
    var digit = document.getElementById("pw-digit");
    var symbol = document.getElementById("pw-symbol");
    var amb = document.getElementById("pw-ambiguous");
    var req = document.getElementById("pw-require");
    if (p === "pin") {
      if (lower) lower.checked = false;
      if (upper) upper.checked = false;
      if (digit) digit.checked = true;
      if (symbol) symbol.checked = false;
      if (amb) amb.checked = false;
      if (req) req.checked = false;
      if (lenEl) lenEl.value = "6";
      if (nEl) nEl.value = "5";
    } else if (p === "simple") {
      if (lower) lower.checked = true;
      if (upper) upper.checked = true;
      if (digit) digit.checked = true;
      if (symbol) symbol.checked = false;
      if (amb) amb.checked = true;
      if (req) req.checked = true;
      if (lenEl) lenEl.value = "12";
      if (nEl && !nEl.value) nEl.value = "5";
    } else if (p === "strong") {
      if (lower) lower.checked = true;
      if (upper) upper.checked = true;
      if (digit) digit.checked = true;
      if (symbol) symbol.checked = true;
      if (amb) amb.checked = true;
      if (req) req.checked = true;
      if (lenEl) lenEl.value = "16";
      if (nEl) nEl.value = nEl.value || "5";
    } else if (p === "paranoid") {
      if (lower) lower.checked = true;
      if (upper) upper.checked = true;
      if (digit) digit.checked = true;
      if (symbol) symbol.checked = true;
      if (amb) amb.checked = false;
      if (req) req.checked = true;
      if (lenEl) lenEl.value = "24";
    }
    setPresetActive(p);
    generate();
  }

  // Presets
  document.querySelectorAll("[data-pw-preset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyPreset(btn.getAttribute("data-pw-preset"));
    });
  });

  // Chỉ cho nhập số ở ô độ dài / số lượng
  function bindNumeric(el) {
    if (!el) return;
    el.addEventListener("input", function () {
      el.value = String(el.value || "").replace(/\D+/g, "");
    });
  }
  bindNumeric(lenEl);
  bindNumeric(nEl);

  if (btnGen) btnGen.addEventListener("click", generate);
  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      if (!lastPasswords.length) {
        setMeta("Chưa có mật khẩu");
        return;
      }
      if (window.ToolLib) {
        ToolLib.copyText(lastPasswords.join("\n"), btnCopy, {
          okLabel: "Đã copy ✓",
          onOk: function () { setMeta("Đã copy " + lastPasswords.length + " mật khẩu"); }
        });
      } else {
        navigator.clipboard.writeText(lastPasswords.join("\n"));
      }
    });
  if (btnClear)
    btnClear.addEventListener("click", function () {
      lastPasswords = [];
      listEl.innerHTML = "";
      if (strengthBox) strengthBox.hidden = true;
      setMeta("");
    });

  // Mặc định: preset Mạnh + sinh sẵn list
  applyPreset("strong");
})();
