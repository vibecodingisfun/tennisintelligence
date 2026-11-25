function centerLevel(bar, smooth) {
  if (!window.matchMedia("(max-width: 800px)").matches) return;
  const buttons = bar.querySelectorAll("button[data-select]");
  if (buttons.length < 2) return;
  const button = bar.querySelector('[aria-pressed="true"]');
  if (!button) return;
  const chip = button.getBoundingClientRect().width;
  if (!chip) return;
  const style = getComputedStyle(bar);
  const pad = parseFloat(style.paddingLeft) || 0;
  const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 0;
  const spacer = Math.max(0, Math.ceil(bar.clientWidth / 2 - chip / 2 - pad - gap));
  let pads = bar.querySelectorAll(":scope > .level-pad");
  if (pads.length !== 2) {
    const lead = document.createElement("span");
    const tail = document.createElement("span");
    lead.className = "level-pad";
    tail.className = "level-pad";
    lead.setAttribute("aria-hidden", "true");
    tail.setAttribute("aria-hidden", "true");
    bar.insertBefore(lead, bar.firstChild);
    bar.appendChild(tail);
    pads = [lead, tail];
  }
  pads.forEach((item) => { item.style.flex = `0 0 ${spacer}px`; });
  const barBox = bar.getBoundingClientRect();
  const buttonBox = button.getBoundingClientRect();
  const delta = buttonBox.left + buttonBox.width / 2 - (barBox.left + barBox.width / 2);
  bar.scrollTo({ left: bar.scrollLeft + delta, behavior: smooth ? "smooth" : "auto" });
}

function bindTables() {
  document.querySelectorAll(".format").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".format").forEach((other) => {
        if (other !== item) other.open = false;
      });
      const bar = item.querySelector(".levels");
      if (bar) requestAnimationFrame(() => centerLevel(bar, false));
    });
  });
  document.querySelectorAll(".levels").forEach((bar) => {
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-select]");
      if (!button) return;
      const sheet = bar.closest(".sheet");
      sheet.dataset.selected = button.dataset.select;
      bar.querySelectorAll("button").forEach((other) => {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      centerLevel(bar, true);
    });
  });
  document.querySelectorAll(".format[open] .levels").forEach((bar) => centerLevel(bar, false));
}

function bindTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = {
    "tab-points": document.getElementById("panel-points"),
    "tab-faq": document.getElementById("panel-faq"),
  };
  function show(id) {
    tabs.forEach((tab) => {
      const on = tab.id === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      const panel = panels[tab.id];
      if (panel) panel.hidden = !on;
    });
    if (id === "tab-points") {
      document.querySelectorAll(".format[open] .levels").forEach((bar) => centerLevel(bar, false));
    }
    const hash = id === "tab-faq" ? "#faq" : "#points";
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.id)));
  const start = location.hash === "#faq" || location.hash.startsWith("#how-") || location.hash === "#compare"
    ? "tab-faq"
    : "tab-points";
  show(start);
  if (location.hash && location.hash !== "#points" && location.hash !== "#faq") {
    const el = document.querySelector(location.hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }
}

bindTables();
bindTabs();
