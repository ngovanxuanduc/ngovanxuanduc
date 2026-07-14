(function () {
  var inn = document.getElementById("b64-in");
  var out = document.getElementById("b64-out");
  var meta = document.getElementById("b64-meta");
  if (!inn || !out) return;

  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s+/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function setMeta(m) {
    if (meta) meta.textContent = m || "";
  }

  document.getElementById("b64-enc").onclick = function () {
    try {
      out.value = utf8ToB64(inn.value);
      setMeta("Encoded · " + out.value.length + " chars");
    } catch (e) {
      setMeta("Lỗi encode: " + e.message);
    }
  };
  document.getElementById("b64-dec").onclick = function () {
    try {
      out.value = b64ToUtf8(inn.value);
      setMeta("Decoded OK");
    } catch (e) {
      setMeta("Lỗi decode — Base64 không hợp lệ");
    }
  };
  document.getElementById("b64-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
  document.getElementById("b64-swap").onclick = function () {
    var t = inn.value;
    inn.value = out.value;
    out.value = t;
  };
  document.getElementById("b64-clear").onclick = function () {
    inn.value = out.value = "";
    setMeta("");
  };
})();
