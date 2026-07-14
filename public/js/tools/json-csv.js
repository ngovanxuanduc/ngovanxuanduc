(function () {
  var inn = document.getElementById("jc-in");
  var out = document.getElementById("jc-out");
  var meta = document.getElementById("jc-meta");
  if (!inn || !out) return;

  function escCsv(v) {
    var s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function jsonToCsv(text) {
    var data = JSON.parse(text);
    if (!Array.isArray(data)) data = [data];
    if (!data.length) return "";
    var keys = [];
    var seen = Object.create(null);
    data.forEach(function (row) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        Object.keys(row).forEach(function (k) {
          if (!seen[k]) {
            seen[k] = true;
            keys.push(k);
          }
        });
      }
    });
    var lines = [keys.map(escCsv).join(",")];
    data.forEach(function (row) {
      lines.push(
        keys
          .map(function (k) {
            var v = row ? row[k] : "";
            if (v != null && typeof v === "object") v = JSON.stringify(v);
            return escCsv(v);
          })
          .join(",")
      );
    });
    return lines.join("\n");
  }

  function parseCsv(text) {
    var rows = [];
    var i = 0;
    var field = "";
    var row = [];
    var q = false;
    text = text.replace(/^\uFEFF/, "");
    while (i < text.length) {
      var c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          q = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === '"') {
        q = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
        i++;
        continue;
      }
      field += c;
      i++;
    }
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  function csvToJson(text) {
    var rows = parseCsv(text);
    if (!rows.length) return "[]";
    var headers = rows[0];
    var arr = [];
    for (var r = 1; r < rows.length; r++) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = rows[r][c] != null ? rows[r][c] : "";
      }
      arr.push(obj);
    }
    return JSON.stringify(arr, null, 2);
  }

  document.getElementById("jc-to-csv").onclick = function () {
    try {
      out.value = jsonToCsv(inn.value);
      if (meta) meta.textContent = "JSON → CSV OK";
    } catch (e) {
      if (meta) meta.textContent = "Lỗi: " + e.message;
    }
  };
  document.getElementById("jc-to-json").onclick = function () {
    try {
      out.value = csvToJson(inn.value);
      if (meta) meta.textContent = "CSV → JSON OK";
    } catch (e) {
      if (meta) meta.textContent = "Lỗi: " + e.message;
    }
  };
  document.getElementById("jc-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
  document.getElementById("jc-clear").onclick = function () {
    inn.value = out.value = "";
    if (meta) meta.textContent = "";
  };
})();
