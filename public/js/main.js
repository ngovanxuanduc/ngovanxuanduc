(function () {
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Mark active nav link by path
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    const href = a.getAttribute("href");
    if (!href) return;
    try {
      const linkPath = new URL(href, window.location.origin).pathname.replace(
        /\/$/,
        ""
      ) || "/";
      const isHome = linkPath === "" || linkPath === "/" || /index\.html$/i.test(linkPath);
      const currentIsHome =
        path === "" || path === "/" || /index\.html$/i.test(path);

      if (
        (isHome && currentIsHome && !path.includes("/games") && !path.includes("/articles")) ||
        (!isHome && path.includes(linkPath.replace(/\.html$/, "")) && linkPath !== "/")
      ) {
        // simpler: match by segment
      }
    } catch (_) {
      /* ignore */
    }
  });

  // Simpler active state: data-nav attribute
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll(".nav__links a[data-nav]").forEach(function (a) {
      if (a.dataset.nav === page) {
        a.classList.add("is-active");
      }
    });
  }
})();
