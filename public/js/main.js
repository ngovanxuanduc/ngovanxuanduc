(function () {
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");

  if (toggle && links) {
    function setNavOpen(open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setNavOpen(!links.classList.contains("is-open"));
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setNavOpen(false);
      });
    });

    // close menu on resize to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) setNavOpen(false);
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
