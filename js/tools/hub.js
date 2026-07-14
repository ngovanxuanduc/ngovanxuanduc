(function () {
  var root = document.getElementById("tools-hub");
  if (!root) return;

  var search = document.getElementById("tools-search");
  var countEl = document.getElementById("tools-count");
  var emptyEl = document.getElementById("tools-empty");
  var chips = root.querySelectorAll(".tools-chip");
  var groups = root.querySelectorAll(".tools-group");
  var links = root.querySelectorAll(".tool-link");
  var activeCat = "all";

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function apply() {
    var q = normalize(search ? search.value : "");
    var shown = 0;

    links.forEach(function (link) {
      var cat = link.getAttribute("data-cat") || "";
      var hay = normalize(
        (link.getAttribute("data-search") || "") +
          " " +
          (link.textContent || "")
      );
      var catOk = activeCat === "all" || cat === activeCat;
      var qOk = !q || hay.indexOf(q) !== -1;
      var ok = catOk && qOk;
      link.hidden = !ok;
      if (ok) shown++;
    });

    groups.forEach(function (group) {
      var any = false;
      group.querySelectorAll(".tool-link").forEach(function (l) {
        if (!l.hidden) any = true;
      });
      group.hidden = !any;
      var nEl = group.querySelector(".tools-group__n");
      if (nEl) {
        var n = 0;
        group.querySelectorAll(".tool-link").forEach(function (l) {
          if (!l.hidden) n++;
        });
        nEl.textContent = n;
      }
    });

    if (countEl) {
      countEl.textContent = shown + " / " + links.length;
    }
    if (emptyEl) {
      emptyEl.classList.toggle("is-visible", shown === 0);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      activeCat = chip.getAttribute("data-cat") || "all";
      chips.forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
      });
      apply();
    });
  });

  if (search) {
    search.addEventListener("input", apply);
    // focus shortcut: /
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search && !e.ctrlKey && !e.metaKey) {
        var tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        search.focus();
      }
    });
  }

  apply();
})();
