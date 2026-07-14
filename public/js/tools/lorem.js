(function () {
  var out = document.getElementById("lo-out");
  if (!out) return;
  var WORDS = (
    "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua " +
    "ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat " +
    "duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur " +
    "excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum " +
    "phasellus vestibulum nisi eu nisl tincidunt a scelerisque mauris purus sit"
  ).split(" ");

  function sentence() {
    var n = 6 + ((Math.random() * 10) | 0);
    var w = [];
    for (var i = 0; i < n; i++) w.push(WORDS[(Math.random() * WORDS.length) | 0]);
    w[0] = w[0].charAt(0).toUpperCase() + w[0].slice(1);
    return w.join(" ") + ".";
  }

  document.getElementById("lo-gen").onclick = function () {
    var p = Math.min(50, Math.max(1, parseInt(document.getElementById("lo-p").value, 10) || 1));
    var s = Math.min(20, Math.max(1, parseInt(document.getElementById("lo-s").value, 10) || 3));
    var paras = [];
    for (var i = 0; i < p; i++) {
      var ss = [];
      for (var j = 0; j < s; j++) ss.push(sentence());
      paras.push(ss.join(" "));
    }
    out.value = paras.join("\n\n");
  };
  document.getElementById("lo-copy").onclick = function () {
    navigator.clipboard.writeText(out.value);
  };
  document.getElementById("lo-gen").click();
})();
