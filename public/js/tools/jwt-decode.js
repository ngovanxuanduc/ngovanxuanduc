(function () {
  var inn = document.getElementById("jwt-in");
  var header = document.getElementById("jwt-header");
  var payload = document.getElementById("jwt-payload");
  var meta = document.getElementById("jwt-meta");
  if (!inn) return;

  function b64urlToJson(part) {
    var s = part.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var text = new TextDecoder().decode(bytes);
    return JSON.stringify(JSON.parse(text), null, 2);
  }

  document.getElementById("jwt-run").onclick = function () {
    try {
      var parts = inn.value.trim().split(".");
      if (parts.length < 2) throw new Error("JWT cần ≥ 2 phần (header.payload)");
      header.value = b64urlToJson(parts[0]);
      payload.value = b64urlToJson(parts[1]);
      if (meta)
        meta.textContent =
          parts.length === 3
            ? "Decoded (signature không verify)"
            : "Decoded · " + parts.length + " parts";
    } catch (e) {
      if (meta) meta.textContent = "Lỗi: " + e.message;
      header.value = payload.value = "";
    }
  };
  document.getElementById("jwt-copy").onclick = function () {
    navigator.clipboard.writeText(payload.value);
  };
  document.getElementById("jwt-clear").onclick = function () {
    inn.value = header.value = payload.value = "";
    if (meta) meta.textContent = "";
  };
})();
