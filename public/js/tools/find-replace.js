(function () {
  var inn = document.getElementById("fr-in");
  var out = document.getElementById("fr-out");
  var find = document.getElementById("fr-find");
  var repl = document.getElementById("fr-repl");
  var meta = document.getElementById("fr-meta");
  if (!inn || !out) return;

  document.getElementById("fr-run").onclick = function () {
    try {
      var text = inn.value;
      var f = find.value;
      var r = repl.value;
      var count = 0;
      var result;

      if (document.getElementById("fr-regex").checked) {
        var flags = "g";
        if (document.getElementById("fr-i").checked) flags += "i";
        if (document.getElementById("fr-m").checked) flags += "m";
        if (document.getElementById("fr-s").checked) flags += "s";
        var re = new RegExp(f, flags);
        result = text.replace(re, function () {
          count++;
          // rebuild args for $n replacement via native replace
          return String.prototype.replace.apply(
            // use a single replace with function below
            "",
            []
          );
        });
        // proper replace with count
        count = 0;
        result = text.replace(re, function (match) {
          count++;
          var args = arguments;
          return r.replace(/\$(\d+)/g, function (_, n) {
            var idx = Number(n);
            return args[idx] != null ? args[idx] : "";
          }).replace(/\$&/g, match);
        });
      } else {
        if (f === "") {
          result = text;
          count = 0;
        } else {
          var parts = text.split(f);
          count = parts.length - 1;
          result = parts.join(r);
        }
      }
      out.value = result;
      if (meta) meta.textContent = "Replaced " + count + " occurrence(s)";
    } catch (e) {
      if (meta) meta.textContent = "Lỗi regex: " + e.message;
    }
  };
  document.getElementById("fr-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
})();
