/**
 * Shell navigation: dashboard vs embedded module iframes.
 * Modules stay isolated (no duplicate ID/CSS conflicts).
 */
(function () {
  const MODULES = {
    grocery: { id: "frame-grocery", title: "Grocery Bill" },
    invoice: { id: "frame-invoice", title: "Invoice Desk" },
    transport: { id: "frame-transport", title: "Transport Invoice" },
  };

  const viewHome = document.getElementById("view-home");
  const viewIframe = document.getElementById("view-iframe");
  const frames = {
    grocery: document.getElementById("frame-grocery"),
    invoice: document.getElementById("frame-invoice"),
    transport: document.getElementById("frame-transport"),
  };

  function setActiveNav(activeKey) {
    document.querySelectorAll(".app-nav-btn[data-module]").forEach((btn) => {
      const m = btn.getAttribute("data-module");
      btn.classList.toggle("is-active", m === activeKey);
    });
  }

  /**
   * @param {'home'|'grocery'|'invoice'|'transport'} name
   */
  function showModule(name) {
    if (name === "home") {
      viewHome.hidden = false;
      viewIframe.hidden = true;
      Object.values(frames).forEach((f) => {
        if (f) f.hidden = true;
      });
      setActiveNav(null);
      if (history.replaceState) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      document.title = "Invoice Suite — Dashboard";
      return;
    }

    const mod = MODULES[name];
    if (!mod || !frames[name]) return;

    viewHome.hidden = true;
    viewIframe.hidden = false;

    Object.entries(frames).forEach(([key, el]) => {
      if (!el) return;
      el.hidden = key !== name;
    });

    setActiveNav(name);
    document.title = `Invoice Suite — ${mod.title}`;
    if (history.replaceState) {
      history.replaceState(null, "", `#${name}`);
    }
  }

  window.showModule = showModule;

  document.getElementById("btn-back-home")?.addEventListener("click", () => showModule("home"));

  document.querySelectorAll(".app-nav-btn[data-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.getAttribute("data-module");
      if (m && MODULES[m]) showModule(m);
    });
  });

  document.querySelectorAll("[data-open-module]").forEach((el) => {
    el.addEventListener("click", () => {
      const m = el.getAttribute("data-open-module");
      if (m && MODULES[m]) showModule(m);
    });
  });

  function routeFromHash() {
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (h === "grocery" || h === "invoice" || h === "transport") {
      showModule(h);
    } else {
      showModule("home");
    }
  }

  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();
})();
