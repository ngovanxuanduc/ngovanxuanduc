(function () {
  var input = document.getElementById("case-input");
  var output = document.getElementById("case-output");
  var meta = document.getElementById("case-meta");
  if (!input || !output) return;

  function toTitle(s) {
    return s.replace(/\w\S*/g, function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
  }

  function toCamel(s) {
    var parts = s
      .replace(/[_\-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim()
      .split(/\s+/);
    if (!parts[0]) return "";
    return (
      parts[0].toLowerCase() +
      parts
        .slice(1)
        .map(function (p) {
          return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
        })
        .join("")
    );
  }

  function toSnake(s) {
    return s
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .replace(/__+/g, "_")
      .toLowerCase();
  }

  function toKebab(s) {
    return toSnake(s).replace(/_/g, "-");
  }

  function run(mode) {
    var s = input.value;
    var out = s;
    switch (mode) {
      case "upper":
        out = s.toUpperCase();
        break;
      case "lower":
        out = s.toLowerCase();
        break;
      case "title":
        out = toTitle(s);
        break;
      case "camel":
        out = toCamel(s);
        break;
      case "snake":
        out = toSnake(s);
        break;
      case "kebab":
        out = toKebab(s);
        break;
      case "reverse":
        out = s.split("").reverse().join("");
        break;
      default:
        out = s;
    }
    output.value = out;
    if (meta) {
      meta.textContent =
        s.length + " ký tự · " + (s ? s.split(/\s+/).filter(Boolean).length : 0) + " từ";
    }
  }

  document.querySelectorAll("[data-case]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      run(btn.getAttribute("data-case"));
    });
  });

  var btnCopy = document.getElementById("case-copy");
  if (btnCopy) {
    if (!btnCopy.getAttribute("data-label")) btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      var text = output.value || "";
      if (window.ToolLib) ToolLib.copyText(text, btnCopy);
      else if (navigator.clipboard) navigator.clipboard.writeText(text || "");
    });
  }

  input.addEventListener("input", function () {
    if (meta) {
      var s = input.value;
      meta.textContent =
        s.length +
        " ký tự · " +
        (s ? s.split(/\s+/).filter(Boolean).length : 0) +
        " từ";
    }
  });
})();
