(function () {
  var valueEl = document.getElementById("ip-value");
  var statusEl = document.getElementById("ip-status");
  var detailsEl = document.getElementById("ip-details");
  var btn = document.getElementById("ip-refresh");
  var btnCopy = document.getElementById("ip-copy");
  if (!valueEl) return;

  var currentIp = "";

  function setStatus(msg, isErr) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = isErr ? "var(--danger)" : "var(--text-muted)";
  }

  function renderDetails(data) {
    if (!detailsEl) return;
    var rows = [
      ["IPv4 / IP", data.ip || "—"],
      ["Thành phố", data.city || "—"],
      ["Vùng", data.region || data.regionName || "—"],
      ["Quốc gia", data.country_name || data.country || "—"],
      ["ISP", data.org || data.isp || "—"],
      ["Timezone", data.timezone || "—"],
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

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fetchIp() {
    valueEl.textContent = "…";
    currentIp = "";
    setStatus("Đang lấy IP…");
    if (detailsEl) detailsEl.innerHTML = "";

    // Primary: ipapi.co (ip + geo). Fallback: ipify.
    fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("ipapi " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.error) throw new Error(data.reason || "ipapi error");
        currentIp = data.ip || "";
        valueEl.textContent = currentIp || "—";
        setStatus("Công khai · qua ipapi.co");
        renderDetails(data);
      })
      .catch(function () {
        return fetch("https://api.ipify.org?format=json", { cache: "no-store" })
          .then(function (res) {
            if (!res.ok) throw new Error("ipify failed");
            return res.json();
          })
          .then(function (data) {
            currentIp = data.ip || "";
            valueEl.textContent = currentIp || "—";
            setStatus("Công khai · qua ipify (không có geo)");
            renderDetails({ ip: currentIp });
          });
      })
      .catch(function () {
        valueEl.textContent = "—";
        setStatus("Không lấy được IP. Kiểm tra mạng / chặn tracker.", true);
      });
  }

  if (btn) btn.addEventListener("click", fetchIp);
  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      if (!currentIp) return;
      navigator.clipboard.writeText(currentIp).then(
        function () {
          btnCopy.textContent = "Đã copy";
          setTimeout(function () {
            btnCopy.textContent = "Copy IP";
          }, 1200);
        },
        function () {}
      );
    });

  fetchIp();
})();
