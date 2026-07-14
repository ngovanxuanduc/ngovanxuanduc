(function () {
  var inn = document.getElementById("js-in");
  var out = document.getElementById("js-out");
  var delim = document.getElementById("js-delim");
  var meta = document.getElementById("js-meta");
  if (!inn || !out) return;

  function parseDelim() {
    var d = delim.value;
    // allow \n \t \s escapes
    return d
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\s/g, " ");
  }

  document.getElementById("js-join").onclick = function () {
    var lines = inn.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    out.value = lines.join(parseDelim());
    if (meta) meta.textContent = "Joined " + lines.length + " lines";
  };
  document.getElementById("js-split").onclick = function () {
    var d = parseDelim();
    if (d === "") {
      out.value = inn.value.split("").join("\n");
    } else {
      out.value = inn.value.split(d).join("\n");
    }
    if (meta) meta.textContent = "Split → lines";
  };
  if (window.ToolLib) {
    ToolLib.bindCopy("js-copy", function () { return out.value || ""; });
  } else {
    var _c = document.getElementById("js-copy");
    if (_c) _c.onclick = function () { navigator.clipboard.writeText(out.value || ""); };
  }
})();
