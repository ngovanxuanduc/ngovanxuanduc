/**
 * Reaction time test — wait for green, click as fast as possible.
 */
(function () {
  "use strict";

  var pad = document.getElementById("rx-pad");
  var msg = document.getElementById("rx-msg");
  var sub = document.getElementById("rx-sub");
  var lastEl = document.getElementById("rx-last");
  var bestEl = document.getElementById("rx-best");
  var avgEl = document.getElementById("rx-avg");
  var resetBtn = document.getElementById("rx-reset");
  if (!pad) return;

  var BEST_KEY = "game-reaction-best";
  var state = "idle"; // idle | wait | go | too-soon | result
  var waitTimer = null;
  var goAt = 0;
  var history = [];
  var best = null;

  try {
    var b = localStorage.getItem(BEST_KEY);
    if (b != null) best = parseInt(b, 10);
    if (!Number.isFinite(best)) best = null;
  } catch (e) {
    best = null;
  }

  function fmt(ms) {
    if (ms == null || !Number.isFinite(ms)) return "—";
    return Math.round(ms) + " ms";
  }

  function updateHud(last) {
    if (lastEl) lastEl.textContent = fmt(last);
    if (bestEl) bestEl.textContent = fmt(best);
    if (avgEl) {
      if (!history.length) avgEl.textContent = "—";
      else {
        var sum = 0;
        for (var i = 0; i < history.length; i++) sum += history[i];
        avgEl.textContent = fmt(sum / history.length);
      }
    }
  }

  function setPad(cls, title, hint) {
    pad.className = "rx-pad " + cls;
    if (msg) msg.textContent = title;
    if (sub) sub.textContent = hint || "";
  }

  function clearWait() {
    if (waitTimer) {
      clearTimeout(waitTimer);
      waitTimer = null;
    }
  }

  function startWait() {
    clearWait();
    state = "wait";
    setPad("is-wait", "Chờ…", "Đừng click vội");
    var delay = 1200 + Math.random() * 2800;
    waitTimer = setTimeout(function () {
      state = "go";
      goAt = performance.now();
      setPad("is-go", "CLICK!", "Ngay bây giờ");
    }, delay);
  }

  function onPad() {
    if (state === "idle" || state === "result" || state === "too-soon") {
      startWait();
      return;
    }
    if (state === "wait") {
      clearWait();
      state = "too-soon";
      setPad("is-soon", "Sớm quá!", "Click để thử lại");
      return;
    }
    if (state === "go") {
      var ms = performance.now() - goAt;
      state = "result";
      history.push(ms);
      if (history.length > 5) history.shift();
      if (best == null || ms < best) {
        best = Math.round(ms);
        try {
          localStorage.setItem(BEST_KEY, String(best));
        } catch (e) {}
      }
      updateHud(ms);
      var note = "Click để chơi tiếp";
      if (ms < 180) note = "Nhanh đấy! · " + note;
      else if (ms > 400) note = "Chậm một chút · " + note;
      setPad("is-result", Math.round(ms) + " ms", note);
    }
  }

  pad.addEventListener("click", onPad);
  pad.addEventListener(
    "touchstart",
    function (e) {
      // avoid 300ms delay double-firing with click on some devices
      if (e.cancelable) e.preventDefault();
      onPad();
    },
    { passive: false }
  );

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      best = null;
      history = [];
      try {
        localStorage.removeItem(BEST_KEY);
      } catch (e) {}
      clearWait();
      state = "idle";
      setPad("is-idle", "Click để bắt đầu", "Rồi chờ xanh…");
      updateHud(null);
    });
  }

  updateHud(null);
})();
