(function () {
  var FIELDS = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
    "measurementId",
    "vapidKey",
  ];
  var STORAGE_KEY = "fcm-push-test-config-v1";
  var logEl = document.getElementById("fcm-log");
  var tokenEl = document.getElementById("fcm-token");
  var statusEl = document.getElementById("fcm-status");
  var payloadEl = document.getElementById("fcm-last-payload");
  var sdkReady = false;
  var messaging = null;
  var currentReg = null;

  function $(id) {
    return document.getElementById(id);
  }

  function log(msg, type) {
    if (!logEl) return;
    var line = document.createElement("div");
    line.className = "fcm-log__line" + (type ? " fcm-log__line--" + type : "");
    var t = new Date().toLocaleTimeString();
    line.textContent = "[" + t + "] " + msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(text, ok) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color =
      ok === true ? "var(--success)" : ok === false ? "var(--danger)" : "var(--text-muted)";
  }

  function readConfig() {
    var cfg = {};
    FIELDS.forEach(function (k) {
      var el = $("fcm-" + k);
      cfg[k] = el ? el.value.trim() : "";
    });
    return cfg;
  }

  function writeConfig(cfg) {
    FIELDS.forEach(function (k) {
      var el = $("fcm-" + k);
      if (el && cfg[k] != null) el.value = cfg[k];
    });
  }

  function firebaseConfigOnly(cfg) {
    var out = {
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    };
    if (cfg.measurementId) out.measurementId = cfg.measurementId;
    return out;
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readConfig()));
      log("Đã lưu config vào localStorage (máy bạn).", "ok");
      setStatus("Config saved locally");
    } catch (e) {
      log("Không lưu được localStorage: " + e.message, "err");
    }
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      writeConfig(JSON.parse(raw));
      log("Đã load config từ localStorage.", "ok");
    } catch (e) {
      log("Load localStorage lỗi: " + e.message, "err");
    }
  }

  function validate(cfg) {
    var need = [
      "apiKey",
      "authDomain",
      "projectId",
      "messagingSenderId",
      "appId",
      "vapidKey",
    ];
    for (var i = 0; i < need.length; i++) {
      if (!cfg[need[i]]) return "Thiếu field: " + need[i];
    }
    if (!window.isSecureContext && location.hostname !== "localhost") {
      return "Cần HTTPS (hoặc localhost).";
    }
    if (!("Notification" in window)) return "Trình duyệt không hỗ trợ Notification.";
    if (!("serviceWorker" in navigator)) return "Trình duyệt không hỗ trợ Service Worker.";
    return null;
  }

  function loadFirebaseSdk() {
    if (sdkReady && window.firebase) return Promise.resolve();
    if (window.firebase && firebase.messaging) {
      sdkReady = true;
      return Promise.resolve();
    }
    function load(src) {
      return new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = function () {
          reject(new Error("Load fail: " + src));
        };
        document.head.appendChild(s);
      });
    }
    return load(
      "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
    ).then(function () {
      return load(
        "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
      );
    }).then(function () {
      sdkReady = true;
      log("Firebase SDK loaded.", "ok");
    });
  }

  function encodeCfg(fbCfg) {
    return encodeURIComponent(btoa(JSON.stringify(fbCfg)));
  }

  async function registerSw(fbCfg) {
    var path = "/firebase-messaging-sw.js?cfg=" + encodeCfg(fbCfg);
    // Unregister old FCM SWs with different cfg to avoid stale config
    var regs = await navigator.serviceWorker.getRegistrations();
    for (var i = 0; i < regs.length; i++) {
      var scr = regs[i].active || regs[i].waiting || regs[i].installing;
      var url = scr && scr.scriptURL ? scr.scriptURL : "";
      if (url.indexOf("firebase-messaging-sw.js") !== -1) {
        await regs[i].unregister();
        log("Unregistered old FCM SW.", "ok");
      }
    }
    var reg = await navigator.serviceWorker.register(path, { scope: "/" });
    await navigator.serviceWorker.ready;
    currentReg = reg;
    log("Service Worker registered: " + path.split("?")[0], "ok");
    return reg;
  }

  async function initAndToken() {
    var cfg = readConfig();
    var err = validate(cfg);
    if (err) {
      log(err, "err");
      setStatus(err, false);
      return;
    }

    setStatus("Đang khởi tạo…");
    log("Requesting notification permission…");

    try {
      await loadFirebaseSdk();
      var perm = await Notification.requestPermission();
      log("Permission: " + perm, perm === "granted" ? "ok" : "err");
      if (perm !== "granted") {
        setStatus("Permission denied", false);
        return;
      }

      var fbCfg = firebaseConfigOnly(cfg);
      var reg = await registerSw(fbCfg);

      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(fbCfg);
      } else {
        try {
          firebase.initializeApp(fbCfg);
        } catch (e) {
          // already initialized — reuse (reload page if bạn đổi project)
          if (String(e.message || e).indexOf("already exists") === -1 && e.code !== "app/duplicate-app") {
            throw e;
          }
          log("Firebase app already init — reuse instance. Đổi project? hard-refresh trang.", "ok");
        }
      }
      messaging = firebase.messaging();

      messaging.onMessage(function (payload) {
        log("Foreground message received", "ok");
        if (payloadEl) {
          payloadEl.value = JSON.stringify(payload, null, 2);
        }
        var n = payload.notification || {};
        var title = n.title || "FCM foreground";
        var body = n.body || JSON.stringify(payload.data || payload);
        // Show system notification even in foreground for easier testing
        if (Notification.permission === "granted") {
          try {
            new Notification(title, {
              body: body,
              icon: n.icon || "/favicon.ico",
            });
          } catch (e) {
            log("Notification() failed: " + e.message, "err");
          }
        }
        setStatus("Got foreground message ✓", true);
      });

      log("getToken…");
      var token = await messaging.getToken({
        vapidKey: cfg.vapidKey,
        serviceWorkerRegistration: reg,
      });

      if (!token) {
        log("getToken trả về rỗng — kiểm tra VAPID + Cloud Messaging API.", "err");
        setStatus("No token", false);
        return;
      }

      if (tokenEl) tokenEl.value = token;
      log("FCM token OK (" + token.length + " chars)", "ok");
      setStatus("Ready — token sẵn sàng để test", true);
      saveLocal();
    } catch (e) {
      console.error(e);
      log("Error: " + (e && e.message ? e.message : String(e)), "err");
      if (e && e.code) log("Code: " + e.code, "err");
      setStatus("Failed — xem log", false);
    }
  }

  function copyToken() {
    if (!tokenEl || !tokenEl.value) {
      log("Chưa có token.", "err");
      return;
    }
    navigator.clipboard.writeText(tokenEl.value).then(
      function () {
        log("Đã copy FCM token.", "ok");
      },
      function () {
        tokenEl.select();
        document.execCommand("copy");
        log("Đã copy (fallback).", "ok");
      }
    );
  }

  function clearLog() {
    if (logEl) logEl.innerHTML = "";
  }

  // Wire UI
  var btnStart = $("fcm-start");
  var btnSave = $("fcm-save");
  var btnCopy = $("fcm-copy-token");
  var btnClearLog = $("fcm-clear-log");
  var btnClearCfg = $("fcm-clear-cfg");

  if (btnStart) btnStart.addEventListener("click", initAndToken);
  if (btnSave) btnSave.addEventListener("click", saveLocal);
  if (btnCopy) btnCopy.addEventListener("click", copyToken);
  if (btnClearLog) btnClearLog.addEventListener("click", clearLog);
  if (btnClearCfg)
    btnClearCfg.addEventListener("click", function () {
      FIELDS.forEach(function (k) {
        var el = $("fcm-" + k);
        if (el) el.value = "";
      });
      if (tokenEl) tokenEl.value = "";
      if (payloadEl) payloadEl.value = "";
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      log("Đã xóa form + localStorage.", "ok");
      setStatus("Cleared");
    });

  // Paste full JSON config helper
  var btnPasteJson = $("fcm-paste-json");
  if (btnPasteJson)
    btnPasteJson.addEventListener("click", function () {
      var raw = prompt("Dán firebaseConfig JSON (từ Firebase Console):");
      if (!raw) return;
      try {
        var obj = JSON.parse(raw);
        // support nested or firebaseConfig key
        if (obj.firebase && obj.firebase.apiKey) obj = obj.firebase;
        writeConfig({
          apiKey: obj.apiKey || "",
          authDomain: obj.authDomain || "",
          projectId: obj.projectId || "",
          storageBucket: obj.storageBucket || "",
          messagingSenderId: obj.messagingSenderId || "",
          appId: obj.appId || "",
          measurementId: obj.measurementId || "",
          vapidKey: readConfig().vapidKey,
        });
        log("Đã điền config từ JSON.", "ok");
      } catch (e) {
        log("JSON không hợp lệ: " + e.message, "err");
      }
    });

  // Boot
  loadLocal();
  setStatus(
    window.isSecureContext || location.hostname === "localhost"
      ? "Nhập config → Start"
      : "Cần HTTPS"
  );
  log(
    "FCM Web Push tester. Token dùng trong Firebase Console → Messaging → Send test message."
  );
  if (location.protocol === "file:") {
    log("Đang mở file:// — SW/FCM thường không chạy. Hãy host qua HTTPS/localhost.", "err");
  }
})();
