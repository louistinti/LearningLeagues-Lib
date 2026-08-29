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
})();
