(function () {
  var v4El = document.getElementById("ip-v4");
  var v6El = document.getElementById("ip-v6");
  var statusEl = document.getElementById("ip-status");
  var detailsEl = document.getElementById("ip-details");
  var btnRefresh = document.getElementById("ip-refresh");
  var btnCopyV4 = document.getElementById("ip-copy-v4");
  var btnCopyV6 = document.getElementById("ip-copy-v6");
  var btnCopyBoth = document.getElementById("ip-copy-both");
  if (!v4El || !v6El) return;

  var state = { v4: "", v6: "" };

  function setStatus(msg, isErr) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = isErr ? "var(--danger)" : "var(--text-muted)";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function isIPv4(ip) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip || "");
  }

  function isIPv6(ip) {
    // rough: has colon, not pure IPv4
    return !!ip && ip.indexOf(":") !== -1;
  }

  function flashCopy(btn, label) {
    if (window.ToolLib && ToolLib.flashCopied) {
      ToolLib.flashCopied(btn, label || "Đã copy ✓");
      return;
    }
    if (!btn) return;
    if (btn._reset) clearTimeout(btn._reset);
    var prev = btn.getAttribute("data-label") || btn.textContent || "Copy";
    if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", prev);
    btn.textContent = label || "Đã copy ✓";
    btn.classList.add("is-copied");
    btn._reset = setTimeout(function () {
      btn.textContent = btn.getAttribute("data-label") || "Copy";
      btn.classList.remove("is-copied");
      btn._reset = null;
    }, 1300);
  }

  function updateCopyButtons() {
    if (btnCopyV4) btnCopyV4.disabled = !state.v4;
    if (btnCopyV6) btnCopyV6.disabled = !state.v6;
    if (btnCopyBoth) btnCopyBoth.disabled = !(state.v4 || state.v6);
  }

  function renderDetails(geo) {
    if (!detailsEl) return;
    geo = geo || {};
    var rows = [
      ["IPv4", state.v4 || "—"],
      ["IPv6", state.v6 || "—"],
      ["Thành phố", geo.city || "—"],
      ["Vùng", geo.region || geo.regionName || "—"],
      ["Quốc gia", geo.country_name || geo.country || "—"],
      ["ISP", geo.org || geo.isp || "—"],
      ["Timezone", geo.timezone || "—"],
    ];
    detailsEl.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="ip-details__row"><dt>' +
          r[0] +
          "</dt><dd>" +
          escapeHtml(String(r[1])) +
          "</dd></div>"
        );
      })
      .join("");
  }

  /** Fetch JSON IP from first working endpoint. */
  function fetchIpJson(urls) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error("all endpoints failed"));
      var url = urls[i++];
      return fetch(url, { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          var ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.indexOf("json") !== -1) return res.json();
          return res.text().then(function (t) {
            return { ip: String(t || "").trim() };
          });
        })
        .then(function (data) {
          var ip = (data && (data.ip || data.query || data.origin)) || "";
          ip = String(ip).trim();
          if (!ip) throw new Error("empty ip");
          return ip;
        })
        .catch(function () {
          return next();
        });
    }
    return next();
  }

  function fetchIPv4() {
    return fetchIpJson([
      "https://api.ipify.org?format=json",
      "https://ipv4.icanhazip.com/",
      "https://api4.ipify.org?format=json",
    ]).then(function (ip) {
      if (!isIPv4(ip)) throw new Error("not v4: " + ip);
      return ip;
    });
  }

  function fetchIPv6() {
    return fetchIpJson([
      "https://api6.ipify.org?format=json",
      "https://ipv6.icanhazip.com/",
    ]).then(function (ip) {
      if (!isIPv6(ip)) throw new Error("not v6: " + ip);
      return ip;
    });
  }

  function fetchGeo() {
    return fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("ipapi " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.error) throw new Error(data.reason || "ipapi error");
        return data || {};
      })
      .catch(function () {
        return {};
      });
  }

  function fetchIp() {
    state.v4 = "";
    state.v6 = "";
    v4El.textContent = "…";
    v6El.textContent = "…";
    updateCopyButtons();
    setStatus("Đang lấy IPv4 & IPv6…");
    if (detailsEl) detailsEl.innerHTML = "";

    var v4Done = false;
    var v6Done = false;
    var geoData = {};

    function maybeFinishStatus() {
      if (!v4Done || !v6Done) return;
      var parts = [];
      if (state.v4) parts.push("IPv4");
      if (state.v6) parts.push("IPv6");
      if (parts.length) {
        setStatus("Công khai · " + parts.join(" + "));
      } else {
        setStatus("Không lấy được IP. Kiểm tra mạng / chặn tracker.", true);
      }
      renderDetails(geoData);
      updateCopyButtons();
    }

    fetchIPv4()
      .then(function (ip) {
        state.v4 = ip;
        v4El.textContent = ip;
      })
      .catch(function () {
        v4El.textContent = "Không có";
        v4El.classList.add("is-empty");
      })
      .then(function () {
        v4El.classList.toggle("is-empty", !state.v4);
        v4Done = true;
        maybeFinishStatus();
      });

    fetchIPv6()
      .then(function (ip) {
        state.v6 = ip;
        v6El.textContent = ip;
      })
      .catch(function () {
        v6El.textContent = "Không có / mạng chưa hỗ trợ";
      })
      .then(function () {
        v6El.classList.toggle("is-empty", !state.v6);
        v6Done = true;
        maybeFinishStatus();
      });

    fetchGeo().then(function (data) {
      geoData = data || {};
      // If ipapi returned an address, use it as fallback for missing family
      var gip = data && data.ip ? String(data.ip).trim() : "";
      if (gip) {
        if (!state.v4 && isIPv4(gip)) {
          state.v4 = gip;
          v4El.textContent = gip;
          v4El.classList.remove("is-empty");
        }
        if (!state.v6 && isIPv6(gip)) {
          state.v6 = gip;
          v6El.textContent = gip;
          v6El.classList.remove("is-empty");
        }
      }
      if (v4Done && v6Done) {
        renderDetails(geoData);
        updateCopyButtons();
      }
    });
  }

  function copyText(text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      function () {
        flashCopy(btn, "Đã copy ✓");
      },
      function () {
        setStatus("Copy thất bại", true);
      }
    );
  }

  if (btnRefresh) btnRefresh.addEventListener("click", fetchIp);

  if (btnCopyV4) {
    btnCopyV4.addEventListener("click", function () {
      copyText(state.v4, btnCopyV4);
    });
  }
  if (btnCopyV6) {
    btnCopyV6.addEventListener("click", function () {
      copyText(state.v6, btnCopyV6);
    });
  }
  if (btnCopyBoth) {
    btnCopyBoth.addEventListener("click", function () {
      var lines = [];
      if (state.v4) lines.push("IPv4\t" + state.v4);
      if (state.v6) lines.push("IPv6\t" + state.v6);
      if (!lines.length) return;
      copyText(lines.join("\n"), btnCopyBoth);
    });
  }

  fetchIp();
})();
