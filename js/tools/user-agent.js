(function () {
  var uaEl = document.getElementById("ua-ua");
  var details = document.getElementById("ua-details");
  if (!uaEl) return;
  uaEl.textContent = navigator.userAgent || "—";
  var rows = [
    ["Platform", navigator.platform || "—"],
    ["Language", navigator.language || "—"],
    ["Languages", (navigator.languages || []).join(", ") || "—"],
    ["Cookies enabled", String(navigator.cookieEnabled)],
    ["Online", String(navigator.onLine)],
    ["Hardware concurrency", String(navigator.hardwareConcurrency || "—")],
    ["Device memory (GB)", String(navigator.deviceMemory || "—")],
    ["Max touch points", String(navigator.maxTouchPoints || 0)],
    ["Vendor", navigator.vendor || "—"],
    ["Screen", screen.width + "×" + screen.height + " @ " + (window.devicePixelRatio || 1) + "x"],
    ["Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "—"],
  ];
  details.innerHTML = rows
    .map(function (r) {
      return (
        '<div class="ip-details__row"><dt>' +
        r[0] +
        "</dt><dd>" +
        String(r[1])
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;") +
        "</dd></div>"
      );
    })
    .join("");
})();
