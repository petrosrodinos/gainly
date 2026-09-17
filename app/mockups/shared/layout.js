/* ==========================================================================
   invest-tax — shared app shell (sidebar + topbar) for authenticated pages.
   Include after icons.js and mock-data.js, then call:
     mountLayout({ active: 'dashboard', title: 'Dashboard', crumbs: [...] })
   ========================================================================== */

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "home" }],
  },
  {
    title: "Portfolio",
    items: [
      { key: "accounts", label: "Accounts", href: "accounts.html", icon: "layers" },
      { key: "holdings", label: "Holdings", href: "holdings.html", icon: "trending" },
      { key: "transactions", label: "Transactions", href: "transactions.html", icon: "list" },
      { key: "instruments", label: "Instruments", href: "instruments.html", icon: "tag" },
      { key: "corporate-actions", label: "Corporate actions", href: "corporate-actions.html", icon: "repeat" },
    ],
  },
  {
    title: "Statements",
    items: [{ key: "imports", label: "Imports", href: "imports.html", icon: "upload", badge: "2" }],
  },
  {
    title: "Tax",
    items: [{ key: "tax", label: "Tax years", href: "tax.html", icon: "calculator" }],
  },
  {
    title: "Reporting",
    items: [
      { key: "reports", label: "Reports", href: "reports.html", icon: "filetext" },
      { key: "documents", label: "Documents", href: "documents.html", icon: "folder" },
    ],
  },
  {
    title: "Admin",
    items: [
      { key: "admin-imports", label: "Import triage", href: "admin-imports.html", icon: "shield" },
      { key: "admin-templates", label: "Mapping templates", href: "admin-templates.html", icon: "layers" },
      { key: "admin-ai-usage", label: "AI usage", href: "admin-ai-usage.html", icon: "cpu" },
    ],
  },
];

function sidebarHtml(active) {
  const groups = NAV_SECTIONS.map((section) => {
    const items = section.items
      .map((item) => {
        const isActive = item.key === active;
        return `<a href="${item.href}" class="nav-item${isActive ? " active" : ""}">
          ${icon(item.icon, "icon")}
          <span class="sidebar-label">${item.label}</span>
          ${item.badge ? `<span class="sidebar-label nav-badge badge badge-warning">${item.badge}</span>` : ""}
        </a>`;
      })
      .join("");
    return `<div class="sidebar-group">
      <div class="sidebar-group-title">${section.title}</div>
      ${items}
    </div>`;
  }).join("");

  return `
    <div class="sidebar-brand">
      <div class="sidebar-mark">IT</div>
      <div class="sidebar-brand-text">invest-tax<small>Portfolio &amp; tax</small></div>
    </div>
    <div class="sidebar-scroll">${groups}</div>
    <div class="sidebar-footer">
      <a href="settings.html" class="nav-item">
        ${icon("settings", "icon")}
        <span class="sidebar-label">Settings</span>
      </a>
      <a href="login.html" class="nav-item" onclick="return true;">
        ${icon("logOut", "icon")}
        <span class="sidebar-label">Sign out</span>
      </a>
    </div>
  `;
}

function topbarHtml({ title, crumbs }) {
  const crumbHtml = (crumbs && crumbs.length)
    ? `<nav class="breadcrumbs">${crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (isLast
          ? `<span class="current">${c.label}</span>`
          : `<a href="${c.href}">${c.label}</a><span class="sep">/</span>`);
      }).join("")}</nav>`
    : `<div class="font-semibold text-sm">${title || ""}</div>`;

  return `
    <button class="btn btn-ghost btn-icon" id="btn-mobile-nav" aria-label="Toggle navigation">${icon("menu")}</button>
    <button class="btn btn-ghost btn-icon hidden md:inline-flex" id="btn-collapse-sidebar" aria-label="Collapse sidebar">${icon("menu")}</button>
    <div class="flex-1 min-w-0">${crumbHtml}</div>

    <div class="hidden md:flex items-center gap-2 relative">
      ${icon("search", "icon absolute left-2.5 text-[var(--muted-foreground)]")}
      <input class="input !pl-8 !w-64" placeholder="Search transactions, instruments…" />
    </div>

    <div class="dropdown">
      <button class="btn btn-ghost btn-icon relative" id="btn-notifications" aria-label="Notifications">
        ${icon("bell")}
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style="background:var(--destructive)"></span>
      </button>
      <div class="dropdown-menu" id="menu-notifications" style="width:320px; min-width:320px;">
        <div class="dropdown-label">Notifications</div>
        ${NOTIFICATIONS.slice(0, 4).map((n) => `
          <div class="dropdown-item" style="align-items:flex-start; white-space:normal;">
            <span class="badge-dot mt-1.5" style="color:${n.kind === "destructive" ? "var(--destructive)" : n.kind === "warning" ? "var(--warning)" : n.kind === "success" ? "var(--success)" : "var(--chart-2)"}"></span>
            <span>
              <div style="font-weight:600; font-size:.78rem;">${n.title}</div>
              <div style="color:var(--muted-foreground); font-size:.72rem;">${n.body}</div>
            </span>
          </div>`).join("")}
        <div class="dropdown-sep"></div>
        <a href="notifications.html" class="dropdown-item" style="justify-content:center; color:var(--primary);">View all notifications</a>
      </div>
    </div>

    <button class="btn btn-ghost btn-icon" id="btn-theme" aria-label="Toggle theme">${icon("moon")}</button>

    <div class="dropdown">
      <button class="btn btn-ghost !px-1.5" id="btn-user-menu">
        <span class="avatar">${CURRENT_USER.initials}</span>
        ${icon("chevronDown", "icon hidden sm:inline")}
      </button>
      <div class="dropdown-menu" id="menu-user">
        <div class="dropdown-label">${CURRENT_USER.name}</div>
        <div class="px-2 pb-2 -mt-1" style="font-size:.72rem; color:var(--muted-foreground);">${CURRENT_USER.email}</div>
        <div class="dropdown-sep"></div>
        <a href="settings.html" class="dropdown-item">${icon("settings")}Account settings</a>
        <a href="documents.html" class="dropdown-item">${icon("download")}Export my data</a>
        <div class="dropdown-sep"></div>
        <a href="login.html" class="dropdown-item danger">${icon("logOut")}Sign out</a>
      </div>
    </div>
  `;
}

function mountLayout(opts) {
  const sidebarRoot = document.getElementById("sidebar-root");
  const topbarRoot = document.getElementById("topbar-root");
  if (sidebarRoot) {
    sidebarRoot.className = "app-sidebar";
    sidebarRoot.innerHTML = sidebarHtml(opts.active);
  }
  if (topbarRoot) {
    topbarRoot.className = "app-topbar";
    topbarRoot.innerHTML = topbarHtml(opts);
  }

  document.getElementById("btn-mobile-nav")?.addEventListener("click", () => {
    sidebarRoot.classList.toggle("mobile-open");
  });
  document.getElementById("btn-collapse-sidebar")?.addEventListener("click", () => {
    sidebarRoot.classList.toggle("collapsed");
  });
  document.title = `${opts.title ? opts.title + " · " : ""}invest-tax`;

  initDropdowns();
  initThemeToggle();
}
