(function () {
  var hex = document.getElementById("co-hex");
  var rgb = document.getElementById("co-rgb");
  var hsl = document.getElementById("co-hsl");
  var swatch = document.getElementById("co-swatch");
  var picker = document.getElementById("co-picker");
  var meta = document.getElementById("co-meta");
  if (!hex) return;
  var lock = false;

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function parseHex(s) {
    s = s.trim().replace(/^#/, "");
    if (s.length === 3)
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }

  function toHex(c) {
    function h(n) {
      return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    }
    return "#" + h(c.r) + h(c.g) + h(c.b);
  }

  function rgbToHsl(c) {
    var r = c.r / 255,
      g = c.g / 255,
      b = c.b / 255;
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    if (s === 0) {
      var v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }

  function apply(c, except) {
    if (!c) return;
    lock = true;
    var hx = toHex(c);
    var hs = rgbToHsl(c);
    if (except !== "hex") hex.value = hx;
    if (except !== "rgb") rgb.value = c.r + ", " + c.g + ", " + c.b;
    if (except !== "hsl") hsl.value = hs.h + ", " + hs.s + "%, " + hs.l + "%";
    if (swatch) swatch.style.background = hx;
    if (picker) picker.value = hx;
    lock = false;
    if (meta) meta.textContent = hx + " · rgb(" + c.r + "," + c.g + "," + c.b + ")";
  }

  hex.addEventListener("input", function () {
    if (lock) return;
    apply(parseHex(hex.value), "hex");
  });
  rgb.addEventListener("input", function () {
    if (lock) return;
    var m = rgb.value.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return;
    apply(
      { r: +m[1], g: +m[2], b: +m[3] },
      "rgb"
    );
  });
  hsl.addEventListener("input", function () {
    if (lock) return;
    var m = hsl.value.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return;
    apply(hslToRgb(+m[1], +m[2], +m[3]), "hsl");
  });
  if (picker)
    picker.addEventListener("input", function () {
      apply(parseHex(picker.value), null);
    });
  apply(parseHex(hex.value), null);
})();
