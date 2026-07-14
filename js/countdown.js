/**
 * Countdown Tết Dương lịch + Tết Âm lịch.
 *
 * Prefixes:
 *  - ny- / ny-ln-  : home widgets
 *  - cd- / cd-ln-  : calendar page
 *
 * Cần load lunar.js trước (cho Tết Âm).
 */
(function () {
  function pad(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    // days can be 3+ digits — only force 2 for h/m/s style values below 100
    if (n < 10) return "0" + n;
    return String(n);
  }

  function nextSolarNewYear() {
    var now = new Date();
    var y = now.getFullYear();
    var target = new Date(y, 0, 1, 0, 0, 0, 0);
    // If đã qua 1/1 năm nay → lấy 1/1 năm sau
    if (now >= target) target = new Date(y + 1, 0, 1, 0, 0, 0, 0);
    return target;
  }

  function nextLunarNewYear() {
    if (!window.LunarVN || !LunarVN.getNextLunarNewYear) return null;
    return LunarVN.getNextLunarNewYear(new Date());
  }

  function remaining(target) {
    var total = Math.max(0, Math.floor((target - new Date()) / 1000));
    return {
      total: total,
      days: Math.floor(total / 86400),
      hours: Math.floor(total / 3600) % 24,
      minutes: Math.floor(total / 60) % 60,
      seconds: total % 60,
    };
  }

  function setDigits(prefix, t) {
    var days = document.getElementById(prefix + "days");
    var hours = document.getElementById(prefix + "hours");
    var minutes = document.getElementById(prefix + "minutes");
    var seconds = document.getElementById(prefix + "seconds");
    if (!days || !hours || !minutes || !seconds) return false;
    days.textContent = pad(t.days);
    hours.textContent = pad(t.hours);
    minutes.textContent = pad(t.minutes);
    seconds.textContent = pad(t.seconds);
    return true;
  }

  function formatSolarDate(d) {
    return (
      d.getDate() +
      "/" +
      (d.getMonth() + 1) +
      "/" +
      d.getFullYear()
    );
  }

  function tick() {
    // Dương lịch
    var solarTarget = nextSolarNewYear();
    var solarRem = remaining(solarTarget);
    ["ny-", "cd-"].forEach(function (prefix) {
      if (!setDigits(prefix, solarRem)) return;
      var label = document.getElementById(prefix + "label");
      // short — tránh vỡ header
      if (label) label.textContent = "→ 1/1/" + solarTarget.getFullYear();
    });

    // Âm lịch
    var lunar = nextLunarNewYear();
    if (!lunar) return;
    var lunarRem = remaining(lunar.date);
    ["ny-ln-", "cd-ln-"].forEach(function (prefix) {
      if (!setDigits(prefix, lunarRem)) return;
      var label = document.getElementById(prefix + "label");
      if (label) {
        label.textContent =
          "→ " + formatSolarDate(lunar.date) + " · " + (lunar.canChiYear || "");
      }
      var title = document.getElementById(prefix + "title");
      // giữ title ngắn; can chi để ở sub
      if (title) title.textContent = "Tết Âm lịch";
    });
  }

  tick();
  setInterval(tick, 1000);
})();
