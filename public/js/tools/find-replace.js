(function () {
  var inn = document.getElementById("fr-in");
  var out = document.getElementById("fr-out");
  var find = document.getElementById("fr-find");
  var repl = document.getElementById("fr-repl");
  var meta = document.getElementById("fr-meta");
  var btnRun = document.getElementById("fr-run");
  var btnCopy = document.getElementById("fr-copy");
  if (!inn || !out || !find || !repl) return;

  function setMeta(msg) {
    if (meta) meta.textContent = msg || "";
  }

  function run() {
    try {
      var text = inn.value == null ? "" : String(inn.value);
      var f = find.value == null ? "" : String(find.value);
      var r = repl.value == null ? "" : String(repl.value);
      var count = 0;
      var result;

      var useRegex = document.getElementById("fr-regex");
      if (useRegex && useRegex.checked) {
        if (f === "") {
          setMeta("Regex trống");
          return;
        }
        var flags = "g";
        if (document.getElementById("fr-i") && document.getElementById("fr-i").checked)
          flags += "i";
        if (document.getElementById("fr-m") && document.getElementById("fr-m").checked)
          flags += "m";
        if (document.getElementById("fr-s") && document.getElementById("fr-s").checked)
          flags += "s";
        var re = new RegExp(f, flags);
        result = text.replace(re, function (match) {
          count++;
          var args = arguments;
          // support $&, $1, $2… in replacement
          return r
            .replace(/\$(\d+)/g, function (_, n) {
              var idx = Number(n);
              return args[idx] != null ? String(args[idx]) : "";
            })
            .replace(/\$&/g, match);
        });
      } else {
        if (f === "") {
          result = text;
          count = 0;
        } else {
          // split is fast for plain string find
          var parts = text.split(f);
          count = parts.length - 1;
          result = parts.join(r);
        }
      }
      out.value = result;
      setMeta("Replaced " + count + " occurrence(s)");
    } catch (e) {
      setMeta("Lỗi regex: " + (e && e.message ? e.message : e));
    }
  }

  if (btnRun) btnRun.addEventListener("click", run);
  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      var text = out.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }
})();
