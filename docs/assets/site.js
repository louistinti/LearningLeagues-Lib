// Docs-site switchers — hand-written SHELL. Sets the theme-axis attributes on
// the root element, exactly as a consuming product would (AGENTS.md, token
// rules). Persistence is a viewer convenience, never library state.
(function () {
  var root = document.documentElement;
  function restore(axis) {
    try {
      var v = localStorage.getItem("ll-docs-" + axis);
      if (v) root.setAttribute("data-" + axis, v);
    } catch (e) {
      /* storage blocked: defaults stand */
    }
  }
  function wire(axis) {
    var buttons = document.querySelectorAll("[data-set-" + axis + "]");
    function sync() {
      var current = root.getAttribute("data-" + axis);
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-set-" + axis) === current));
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-set-" + axis);
        root.setAttribute("data-" + axis, v);
        try {
          localStorage.setItem("ll-docs-" + axis, v);
        } catch (e) {
          /* storage blocked: still works for this page */
        }
        sync();
      });
    });
    sync();
  }
  restore("accent");
  restore("density");
  wire("accent");
  wire("density");

  // Scrollspy: highlight the current page's sub-section in the sidebar as the
  // reader scrolls (or clicks an anchor). Purely presentational — the links
  // and anchors themselves are generated from the contracts.
  // Some static hosts serve "/tokens.html" at "/tokens" — compare normalized.
  function normPath(p) {
    return p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  }
  var pairs = Array.prototype.filter
    .call(document.querySelectorAll(".sidebar .sub a"), function (a) {
      return normPath(a.pathname) === normPath(location.pathname) && a.hash;
    })
    .map(function (a) {
      return { link: a, target: document.getElementById(decodeURIComponent(a.hash.slice(1))) };
    })
    .filter(function (p) {
      return p.target;
    });
  function markCurrent() {
    var pos = window.scrollY + window.innerHeight / 4;
    var active = null;
    pairs.forEach(function (p) {
      if (p.target.getBoundingClientRect().top + window.scrollY <= pos) active = p;
    });
    if (!active && pairs.length) active = pairs[0];
    pairs.forEach(function (p) {
      if (p === active) p.link.setAttribute("aria-current", "location");
      else if (p.link.getAttribute("aria-current") === "location")
        p.link.removeAttribute("aria-current");
    });
  }
  if (pairs.length) {
    // Same-page sub-links navigate by hash only: some static hosts serve
    // "/tokens.html" at "/tokens", so following the full href would reload
    // the document (landing at the top before descending to the anchor).
    pairs.forEach(function (p) {
      p.link.addEventListener("click", function (ev) {
        ev.preventDefault();
        p.target.scrollIntoView({ behavior: "smooth" });
        history.pushState(null, "", "#" + p.target.id);
        markCurrent();
      });
    });
    window.addEventListener("scroll", markCurrent, { passive: true });
    window.addEventListener("hashchange", markCurrent);
    markCurrent();
  }
})();
