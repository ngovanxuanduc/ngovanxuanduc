(function () {
  var inn = document.getElementById("cron-in");
  var out = document.getElementById("cron-out");
  var meta = document.getElementById("cron-meta");
  if (!inn || !out) return;

  var NAMES = ["Minute", "Hour", "Day of month", "Month", "Day of week"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function explainField(field, min, max, labels) {
    if (field === "*") return "every value (" + min + "–" + max + ")";
    if (field.indexOf("*/") === 0) {
      var step = field.slice(2);
      return "every " + step + " units";
    }
    if (field.indexOf(",") !== -1) {
      return "at " + field.split(",").join(", ");
    }
    if (field.indexOf("-") !== -1) {
      return "from " + field.replace("-", " to ");
    }
    if (labels && labels[field]) return labels[field] + " (" + field + ")";
    return "at " + field;
  }

  function run() {
    var parts = inn.value.trim().split(/\s+/);
    if (parts.length !== 5) {
      out.textContent = "Cần đúng 5 field: min hour dom mon dow\nVí dụ: */5 * * * *";
      if (meta) meta.textContent = "Invalid";
      return;
    }
    var ranges = [
      [0, 59, null],
      [0, 23, null],
      [1, 31, null],
      [1, 12, MON],
      [0, 6, DOW],
    ];
    var lines = [];
    for (var i = 0; i < 5; i++) {
      lines.push(
        NAMES[i] + " [" + parts[i] + "]: " + explainField(parts[i], ranges[i][0], ranges[i][1], ranges[i][2])
      );
    }
    lines.push("");
    lines.push("Human (approx):");
    lines.push(
      "  At minute " +
        parts[0] +
        ", hour " +
        parts[1] +
        ", day-of-month " +
        parts[2] +
        ", month " +
        parts[3] +
        ", day-of-week " +
        parts[4]
    );
    out.textContent = lines.join("\n");
    if (meta) meta.textContent = "OK · 5-field cron";
  }

  document.getElementById("cron-run").onclick = run;
  inn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") run();
  });
  run();
})();
