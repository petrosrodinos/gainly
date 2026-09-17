/* ==========================================================================
   invest-tax — shared interaction helpers (dropdowns, dialogs, tabs, toasts,
   theme toggle, switches). Pure vanilla JS, no dependencies.
   ========================================================================== */

/* ---------- Dropdowns ---------- */
function initDropdowns() {
  document.querySelectorAll(".dropdown > button").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      const wasOpen = menu.classList.contains("open");
      document.querySelectorAll(".dropdown-menu.open").forEach((m) => m.classList.remove("open"));
      if (!wasOpen) menu.classList.add("open");
    });
  });
  if (!window.__dropdownDocBound) {
    window.__dropdownDocBound = true;
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown-menu.open").forEach((m) => m.classList.remove("open"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".dropdown-menu.open").forEach((m) => m.classList.remove("open"));
        document.querySelectorAll(".overlay.open").forEach((o) => o.classList.remove("open"));
      }
    });
  }
}

/* ---------- Theme toggle ---------- */
function initThemeToggle() {
  const stored = (() => { try { return localStorage.getItem("invest-tax-theme"); } catch { return null; } })();
  if (stored === "dark") document.documentElement.classList.add("dark");
  updateThemeIcon();
  document.getElementById("btn-theme")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    try { localStorage.setItem("invest-tax-theme", isDark ? "dark" : "light"); } catch {}
    updateThemeIcon();
  });
}
function updateThemeIcon() {
  const btn = document.getElementById("btn-theme");
  if (!btn) return;
  const isDark = document.documentElement.classList.contains("dark");
  btn.innerHTML = icon(isDark ? "sun" : "moon");
}
(function earlyTheme() {
  try { if (localStorage.getItem("invest-tax-theme") === "dark") document.documentElement.classList.add("dark"); } catch {}
})();

/* ---------- Dialogs ---------- */
function openDialog(id) { document.getElementById(id)?.classList.add("open"); }
function closeDialog(id) { document.getElementById(id)?.classList.remove("open"); }
function initOverlayBackdropClose() {
  document.querySelectorAll(".overlay").forEach((ov) => {
    if (ov.dataset.bound) return;
    ov.dataset.bound = "1";
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
  });
}
document.addEventListener("DOMContentLoaded", initOverlayBackdropClose);

/* ---------- Tabs ---------- */
function initTabs(root = document) {
  root.querySelectorAll(".tabs-list").forEach((list) => {
    if (list.dataset.bound) return;
    list.dataset.bound = "1";
    const group = list.dataset.tabs;
    list.querySelectorAll(".tab-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        list.querySelectorAll(".tab-trigger").forEach((t) => t.classList.remove("active"));
        trigger.classList.add("active");
        document.querySelectorAll(`.tab-panel[data-tabs="${group}"]`).forEach((p) => p.classList.remove("active"));
        document.querySelector(`.tab-panel[data-tabs="${group}"][data-value="${trigger.dataset.value}"]`)?.classList.add("active");
      });
    });
  });
}
document.addEventListener("DOMContentLoaded", () => initTabs());

/* ---------- Switches ---------- */
function initSwitches(root = document) {
  root.querySelectorAll(".switch").forEach((sw) => {
    if (sw.dataset.bound) return;
    sw.dataset.bound = "1";
    sw.addEventListener("click", () => sw.classList.toggle("on"));
  });
}
document.addEventListener("DOMContentLoaded", () => initSwitches());

/* ---------- Toasts ---------- */
function ensureToastRoot() {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-region";
    document.body.appendChild(root);
  }
  return root;
}
function showToast(title, description, kind = "default") {
  const root = ensureToastRoot();
  const el = document.createElement("div");
  el.className = "toast";
  const colors = { success: "var(--success)", destructive: "var(--destructive)", warning: "var(--warning)", default: "var(--chart-2)" };
  el.innerHTML = `<span class="badge-dot mt-1" style="color:${colors[kind] || colors.default}"></span>
    <span><div style="font-weight:600;">${title}</div>${description ? `<div style="color:var(--muted-foreground); font-size:.75rem; margin-top:.15rem;">${description}</div>` : ""}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .2s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

/* ---------- Row selection helper (tables with checkboxes) ---------- */
function initRowSelection(tableSelector) {
  const table = document.querySelector(tableSelector);
  if (!table) return;
  const headCb = table.querySelector("thead input[type=checkbox]");
  const rowCbs = () => Array.from(table.querySelectorAll("tbody input[type=checkbox]"));
  headCb?.addEventListener("change", () => {
    rowCbs().forEach((cb) => { cb.checked = headCb.checked; cb.closest("tr").classList.toggle("selected", headCb.checked); });
  });
  rowCbs().forEach((cb) => {
    cb.addEventListener("change", () => cb.closest("tr").classList.toggle("selected", cb.checked));
  });
}

/* ---------- Simple client-side text filter for tables ---------- */
function initTableFilter(inputSelector, tableBodySelector) {
  const input = document.querySelector(inputSelector);
  const body = document.querySelector(tableBodySelector);
  if (!input || !body) return;
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    Array.from(body.rows).forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}
