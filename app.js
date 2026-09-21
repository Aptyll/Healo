const STORAGE_KEY = "goals-space-v1";
const STORAGE_LIMIT = 4_800_000;

const AREAS = [
  {
    id: "running",
    name: "Running",
    color: "#79b8ff",
    blurb: "Miles, minutes, and the days you got out.",
    fields: [
      { key: "miles", label: "Miles", type: "number", step: "0.1", unit: "mi" },
      { key: "minutes", label: "Minutes", type: "number", step: "1", unit: "min" }
    ],
    suggest: { title: "Miles", target: 100, unit: "mi", mode: "sum", metric: "miles", period: "all", direction: "up" }
  },
  {
    id: "gym",
    name: "Gym",
    color: "#ff5c33",
    blurb: "Lifts, sessions, and what felt strong.",
    fields: [
      { key: "lift", label: "Lift", type: "text", placeholder: "Squat" },
      { key: "weight", label: "Weight", type: "number", step: "0.5", unit: "lb" },
      { key: "reps", label: "Reps", type: "number", step: "1", unit: "reps" }
    ],
    suggest: { title: "Sessions", target: 12, unit: "sessions", mode: "count", period: "month", direction: "up" }
  },
  {
    id: "budget",
    name: "Budget",
    color: "#e2b15a",
    blurb: "What came in and what went out.",
    fields: [
      { key: "kind", label: "Type", type: "select", options: ["Expense", "Income"] },
      { key: "amount", label: "Amount", type: "number", step: "0.01", unit: "$" },
      { key: "category", label: "Category", type: "text", placeholder: "Groceries" }
    ],
    suggest: {
      title: "Spending cap",
      target: 500,
      unit: "$",
      mode: "sum",
      metric: "amount",
      metricWhen: { kind: "Expense" },
      period: "month",
      direction: "cap"
    }
  },
  {
    id: "sleep",
    name: "Sleep",
    color: "#b0a7ff",
    blurb: "Hours and how the night felt.",
    fields: [
      { key: "hours", label: "Hours", type: "number", step: "0.1", unit: "h" },
      { key: "quality", label: "How it felt", type: "select", options: ["Great", "Okay", "Rough"] }
    ],
    suggest: { title: "Average sleep", target: 8, unit: "h", mode: "avg", metric: "hours", period: "week", direction: "up" }
  },
  {
    id: "nutrition",
    name: "Nutrition",
    color: "#73d6a0",
    blurb: "Meals, calories, and a note if you want one.",
    fields: [
      { key: "meal", label: "Meal", type: "text", placeholder: "Lunch" },
      { key: "calories", label: "Calories", type: "number", step: "1", unit: "cal" }
    ],
    suggest: { title: "Calories today", target: 2200, unit: "cal", mode: "sum", metric: "calories", period: "day", direction: "cap" }
  },
  {
    id: "other",
    name: "Other",
    color: "#a0a6b0",
    blurb: "Anything else you want to keep.",
    fields: [
      { key: "label", label: "What", type: "text", placeholder: "Pages read" },
      { key: "value", label: "Number", type: "number", step: "0.1" },
      { key: "unit", label: "Unit", type: "text", placeholder: "pages" }
    ],
    suggest: { title: "Check-ins", target: 30, unit: "days", mode: "count", period: "all", direction: "up" }
  }
];

const ICONS = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19.2c1.4-2.6 3.6-3.7 6.5-3.7s5.1 1.1 6.5 3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const SPORT = {
  running: "M4 16c2-6 4-6 6 0s4 6 6 0 4-6 4 0",
  gym: "M3 9v6M7 7v10M17 7v10M21 9v6M7 12h10",
  budget: "M12 4v16M16 7.5c0-1.5-1.6-2.5-4-2.5s-4 1-4 2.5 1.8 2.4 4 2.8 4 1.2 4 2.7-1.6 2.5-4 2.5-4-1-4-2.5",
  sleep: "M16 4a7 7 0 1 0 4 12 8 8 0 1 1-4-12z",
  nutrition: "M12 4c2 3 2 5 0 8-2-3-2-5 0-8zM8 13c0 4 1.8 7 4 7s4-3 4-7",
  other: "M12 5v14M5 12h14"
};

let state = load();
let ui = freshUi();

function freshUi() {
  return {
    draft: null,
    draftArea: "",
    photoDraft: "",
    editingId: "",
    goalOpen: false,
    goalDraft: null,
    pendingDelete: "",
    confirmClear: false,
    shareUrl: "",
    lightbox: "",
    logOpen: false
  };
}

function blank() {
  return { version: 1, profile: null, entries: [], goals: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blank();
    const data = JSON.parse(raw);
    return {
      version: 1,
      profile: data.profile?.name ? { name: String(data.profile.name).slice(0, 24), createdAt: data.profile.createdAt || new Date().toISOString() } : null,
      entries: Array.isArray(data.entries) ? data.entries : [],
      goals: Array.isArray(data.goals) ? data.goals : []
    };
  } catch {
    return blank();
  }
}

function snapshot() {
  return { version: 1, profile: state.profile, entries: state.entries, goals: state.goals };
}

function applySnapshot(next) {
  state = {
    version: 1,
    profile: next.profile,
    entries: next.entries,
    goals: next.goals
  };
}

function mutate(change) {
  const previous = snapshot();
  change();
  try {
    const json = JSON.stringify(snapshot());
    if (json.length > STORAGE_LIMIT) {
      const error = new Error("quota");
      error.name = "QuotaExceededError";
      throw error;
    }
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    applySnapshot(previous);
    const full = error && (error.name === "QuotaExceededError" || error.code === 22);
    toast(full
      ? "This phone is out of room for more photos. Delete an older one and try again."
      : "Could not save on this phone. Allow site storage and try again.");
    return false;
  }
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function areaById(id) {
  return AREAS.find((area) => area.id === id);
}

function todayIso(date = new Date()) {
  const copy = new Date(date);
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${copy.getFullYear()}-${month}-${day}`;
}

function parseDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

function formatDay(iso) {
  return parseDate(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatFull(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "area" && areaById(parts[1])) return { name: "area", area: areaById(parts[1]) };
  if (parts[0] === "me" && state.profile) return { name: "me" };
  return { name: "home" };
}

function entriesFor(areaId) {
  return state.entries.filter((entry) => entry.area === areaId);
}

function inPeriod(iso, period) {
  if (!period || period === "all") return true;
  if (period === "day") return iso === todayIso();
  const date = parseDate(iso);
  const now = new Date();
  if (period === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return date >= start;
  }
  if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  return true;
}

function goalFor(areaId) {
  return state.goals.find((goal) => goal.area === areaId) || null;
}

function numberFrom(entry, key) {
  const raw = entry.fields?.[key];
  if (raw === "" || raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function matchesWhen(entry, goal) {
  if (!goal.metricWhen) return true;
  return Object.entries(goal.metricWhen).every(([key, value]) => entry.fields?.[key] === value);
}

function measure(goal) {
  const list = entriesFor(goal.area).filter((entry) => inPeriod(entry.date, goal.period));
  if (goal.mode === "manual") return Number(goal.manualValue) || 0;
  if (goal.mode === "count") return new Set(list.filter((entry) => entry.checked).map((entry) => entry.date)).size;
  const values = list.filter((entry) => matchesWhen(entry, goal)).map((entry) => numberFrom(entry, goal.metric)).filter((value) => value != null);
  if (!values.length) return 0;
  if (goal.mode === "avg") return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + value, 0);
}

function formatNum(value, unit) {
  const number = Number(value) || 0;
  if (unit === "$") {
    const hasCents = Math.round(Math.abs(number) * 100) % 100 !== 0;
    return number.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2
    });
  }
  const rounded = Math.round(number * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return unit ? `${text} ${unit}` : text;
}

function periodLabel(period) {
  return { day: "Today", week: "This week", month: "This month", all: "All time" }[period] || "All time";
}

function progressText(goal, current) {
  if (goal.direction === "cap" && current > goal.target) return `Over by ${formatNum(current - goal.target, goal.unit)}`;
  if (goal.direction !== "cap" && goal.target > 0 && current >= goal.target) return "Goal reached";
  return `${formatNum(current, goal.unit)} of ${formatNum(goal.target, goal.unit)}`;
}

function checkedToday(areaId) {
  const today = todayIso();
  return state.entries.some((entry) => entry.area === areaId && entry.date === today && entry.checked);
}

function streakCount() {
  const days = new Set(state.entries.filter((entry) => entry.checked).map((entry) => entry.date));
  const cursor = new Date();
  if (!days.has(todayIso(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(todayIso(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function cardStat(area) {
  const goal = goalFor(area.id);
  if (goal) {
    const current = measure(goal);
    return {
      value: formatNum(current, goal.unit),
      label: goal.title,
      ratio: goal.target ? Math.min(current / goal.target, 1) : 0,
      over: goal.direction === "cap" && current > goal.target,
      hasGoal: true
    };
  }
  const count = entriesFor(area.id).filter((entry) => !isBlank(entry)).length;
  return { value: String(count), label: count === 1 ? "entry" : "entries", ratio: 0, over: false, hasGoal: false };
}

function isBlank(entry) {
  return !entry.note && !safePhoto(entry.photo) && !Object.values(entry.fields || {}).some((value) => String(value).trim());
}

function summarize(area, fields = {}) {
  const bits = [];
  area.fields.forEach((field) => {
    if (field.key === "unit") return;
    const value = fields[field.key];
    if (value === "" || value == null) return;
    if (field.type === "number") bits.push(formatNum(value, field.unit || fields.unit || ""));
    else bits.push(String(value));
  });
  return bits.join(" · ");
}

function snapshotBits(area) {
  const list = entriesFor(area.id);
  if (area.id === "running") {
    const month = list.filter((entry) => inPeriod(entry.date, "month"));
    const miles = month.reduce((sum, entry) => sum + (numberFrom(entry, "miles") || 0), 0);
    return [["This month", formatNum(miles, "mi")], ["Runs", String(month.filter((entry) => numberFrom(entry, "miles")).length)]];
  }
  if (area.id === "gym") {
    const month = list.filter((entry) => inPeriod(entry.date, "month") && entry.checked);
    return [["Sessions", String(new Set(month.map((entry) => entry.date)).size)], ["Entries", String(list.length)]];
  }
  if (area.id === "budget") {
    const month = list.filter((entry) => inPeriod(entry.date, "month"));
    const spent = month.filter((entry) => entry.fields?.kind !== "Income").reduce((sum, entry) => sum + (numberFrom(entry, "amount") || 0), 0);
    const income = month.filter((entry) => entry.fields?.kind === "Income").reduce((sum, entry) => sum + (numberFrom(entry, "amount") || 0), 0);
    return [["Spent", formatNum(spent, "$")], ["Income", formatNum(income, "$")]];
  }
  if (area.id === "sleep") {
    const week = list.filter((entry) => inPeriod(entry.date, "week")).map((entry) => numberFrom(entry, "hours")).filter((value) => value != null);
    const avg = week.length ? week.reduce((sum, value) => sum + value, 0) / week.length : 0;
    const latest = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map((entry) => numberFrom(entry, "hours")).find((value) => value != null);
    return [["Last night", latest == null ? "—" : formatNum(latest, "h")], ["Week avg", week.length ? formatNum(avg, "h") : "—"]];
  }
  if (area.id === "nutrition") {
    const today = list.filter((entry) => entry.date === todayIso());
    const calories = today.reduce((sum, entry) => sum + (numberFrom(entry, "calories") || 0), 0);
    return [["Today", formatNum(calories, "cal")], ["Meals", String(today.length)]];
  }
  return [["Entries", String(list.length)], ["Checked days", String(new Set(list.filter((entry) => entry.checked).map((entry) => entry.date)).size)]];
}

function safePhoto(src) {
  return typeof src === "string" && src.startsWith("data:image/jpeg;base64,") ? src : "";
}

function fieldInput(field, value = "") {
  const id = `field-${field.key}`;
  if (field.type === "select") {
    const options = field.options.map((option) => `<option value="${esc(option)}"${option === value ? " selected" : ""}>${esc(option)}</option>`).join("");
    return `<label class="field"><span>${esc(field.label)}</span><select name="${esc(field.key)}" id="${id}">${options}</select></label>`;
  }
  const type = field.type === "number" ? "number" : "text";
  const extra = field.type === "number" ? ` inputmode="decimal" step="${esc(field.step || "1")}" min="0"` : "";
  return `<label class="field"><span>${esc(field.label)}</span><input name="${esc(field.key)}" id="${id}" type="${type}"${extra} placeholder="${esc(field.placeholder || "")}" value="${esc(value)}"></label>`;
}

function sportIcon(id) {
  const path = SPORT[id] || SPORT.other;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function shareLink() {
  const url = new URL(location.href);
  url.hash = "";
  return url.toString();
}

function render() {
  captureDraft();
  const view = route();
  const glow = view.area?.color || "#ff5c33";
  document.title = view.area ? `${view.area.name} · Goals` : "Goals";
  const body = !state.profile ? renderWelcome() : view.name === "area" ? renderArea(view.area) : view.name === "me" ? renderMe() : renderHome();
  const showTabs = state.profile && (view.name === "home" || view.name === "me");
  const showDock = state.profile && view.name === "area" && !ui.logOpen;
  document.getElementById("app").innerHTML = `
    ${state.profile ? topbar(view) : ""}
    <main>${body}</main>
    ${showDock ? dock(view.area) : ""}
    ${showTabs ? tabbar(view) : ""}
    ${logSheet(view.area)}
    ${shareSheet()}
    ${lightbox()}
    <div id="toast" class="toast" hidden></div>
  `;
  document.getElementById("app").style.setProperty("--glow", glow);
  restoreDraft();
}

function topbar(view) {
  if (view.name === "area") {
    return `<header class="topbar"><a class="back-link" href="#/" aria-label="Back">${ICONS.back}</a><h1>${esc(view.area.name)}</h1></header>`;
  }
  return `<header class="topbar"><h1>${view.name === "me" ? "You" : "Goals"}</h1></header>`;
}

function tabbar(view) {
  const tab = (href, label, icon, on) => `<a href="${href}"${on ? ' aria-current="page"' : ""}>${icon}<span>${label}</span></a>`;
  return `<nav class="tabbar">${tab("#/", "Home", ICONS.home, view.name === "home")}${tab("#/me", "You", ICONS.user, view.name === "me")}</nav>`;
}

function dock(area) {
  return `<div class="dock"><button class="btn full" type="button" data-action="open-log">Log ${esc(area.name)}</button></div>`;
}

function renderWelcome() {
  return `<section class="welcome">
    <div class="mark">Go</div>
    <h1>Your goals, on this phone.</h1>
    <p class="lede">Running, gym, money, sleep, food, and anything else. Notes and photos stay in this browser.</p>
    <form id="welcome-form" class="stack">
      <label class="field"><span>Your name</span><input name="name" maxlength="24" autocomplete="given-name" placeholder="Your name" required></label>
      <button class="btn full" type="submit">Create my space</button>
    </form>
    <p class="fine" style="margin-top:14px">Send the link to a friend after you are in. They get their own space on their phone.</p>
  </section>`;
}

function rowStat(area) {
  const stat = cardStat(area);
  if (stat.hasGoal) return { value: stat.value, label: stat.label };
  const [label, value] = snapshotBits(area)[0];
  const empty = value === "$0" || /^(0|—)/.test(value);
  return { value: empty ? "" : value, label: empty ? "Nothing logged" : label };
}

function renderHome() {
  const done = AREAS.filter((area) => checkedToday(area.id)).length;
  const streak = streakCount();
  const rows = AREAS.map((area) => {
    const stat = rowStat(area);
    const on = checkedToday(area.id);
    return `<div class="activity">
      <a class="activity-main" href="#/area/${area.id}">
        <span class="sport" style="--area:${area.color}">${sportIcon(area.id)}</span>
        <span><span class="activity-name">${esc(area.name)}</span><span class="fine">${esc(stat.label)}</span></span>
        <span class="activity-stat">${esc(stat.value)}</span>
      </a>
      <button class="check-dot" type="button" data-action="toggle-today" data-area="${area.id}" aria-pressed="${on}" aria-label="${on ? "Checked in" : "Check in"} ${esc(area.name)}">${on ? ICONS.check : ""}</button>
    </div>`;
  }).join("");
  return `<p class="kicker">${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</p>
    <h2 class="hello">${esc(state.profile.name)}</h2>
    <p class="lede">${done} of ${AREAS.length} today${streak ? ` · ${streak} day streak` : ""}</p>
    <div class="activity-list">${rows}</div>`;
}

function heroFor(area) {
  const goal = goalFor(area.id);
  if (goal) {
    const current = measure(goal);
    return {
      kicker: `${goal.title} · ${periodLabel(goal.period)}`,
      value: formatNum(current, goal.unit),
      detail: progressText(goal, current),
      ratio: goal.target ? Math.min(current / goal.target, 1) : 0,
      over: goal.direction === "cap" && current > goal.target,
      showBar: true
    };
  }
  const [label, value] = snapshotBits(area)[0];
  return { kicker: label, value, detail: area.blurb, ratio: 0, over: false, showBar: false };
}

function renderArea(area) {
  const goal = goalFor(area.id);
  const hero = heroFor(area);
  const snaps = snapshotBits(area).map(([label, value]) => `<div><span class="fine">${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
  const entries = entriesFor(area.id).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const visible = entries.filter((entry) => !isBlank(entry));
  const list = visible.length ? `<div class="feed">${visible.map(renderEntry).join("")}</div>` : `<p class="fine">Nothing logged yet. Use Log when you have a number, a note, or a photo.</p>`;
  const on = checkedToday(area.id);
  return `<section class="hero">
      <p class="kicker">${esc(hero.kicker)}</p>
      <p class="hero-stat">${esc(hero.value)}</p>
      <p class="fine">${esc(hero.detail)}</p>
      ${hero.showBar ? `<div class="bar${hero.over ? " over" : ""}" style="margin-top:12px"><i style="width:${Math.round(hero.ratio * 100)}%"></i></div>` : ""}
      <button class="btn ghost" type="button" data-action="toggle-today" data-area="${area.id}" aria-pressed="${on}" style="margin-top:12px">${on ? "Checked in today" : "Check in today"}</button>
    </section>
    <div class="snap">${snaps}</div>
    ${renderGoal(area, goal)}
    <p class="section-label">Recent</p>
    ${list}`;
}

function entryForm(area) {
  const editing = entriesFor(area.id).find((entry) => entry.id === ui.editingId);
  const seed = editing ? { date: editing.date, note: editing.note || "", ...editing.fields } : { date: todayIso(), note: "" };
  const draft = ui.draft && ui.draftArea === area.id ? { ...seed, ...ui.draft } : seed;
  return `<form id="entry-form" class="stack" data-area="${area.id}" autocomplete="off">
    <label class="field"><span>Date</span><input type="date" name="date" max="${todayIso()}" value="${esc(draft.date || todayIso())}" required></label>
    ${area.fields.map((field) => fieldInput(field, draft[field.key] ?? "")).join("")}
    <label class="field"><span>Note</span><textarea name="note" maxlength="2000" placeholder="How did it go?">${esc(draft.note || "")}</textarea></label>
    <label class="file-btn">Add a photo<input id="photo-input" type="file" accept="image/*"></label>
    <div id="photo-preview" class="preview" hidden>
      <img alt="Selected photo" id="photo-preview-img">
      <button class="btn ghost" type="button" data-action="clear-photo">Remove photo</button>
    </div>
    <button class="btn full" type="submit">${editing ? "Save changes" : "Save"}</button>
    <p class="fine">Saved on this phone.</p>
  </form>`;
}

function logSheet(area) {
  if (!ui.logOpen || !area) return "";
  return `<div class="sheet-back" data-action="close-log">
    <section class="sheet" data-sheet data-action="hold" role="dialog" aria-label="${ui.editingId ? "Edit entry" : "Log"}">
      <div class="sheet-grab"></div>
      <h2 class="block-title">${ui.editingId ? "Edit" : "Log"} ${esc(area.name)}</h2>
      ${entryForm(area)}
    </section>
  </div>`;
}

function renderGoal(area, goal) {
  if (!goal) {
    const suggest = suggestionLabel(area);
    return `<section class="goal-card" style="--area:${area.color}">
      <h2>Goal</h2>
      <p class="fine">Pick a target. Progress updates from what you log.</p>
      <div class="actions" style="margin-top:12px">
        <button class="btn" type="button" data-action="use-suggestion" data-area="${area.id}">${esc(suggest)}</button>
        <button class="btn secondary" type="button" data-action="toggle-goal">Custom goal</button>
      </div>
      ${goalForm(area)}
    </section>`;
  }
  const current = measure(goal);
  const ratio = goal.target ? Math.min(current / goal.target, 1) : 0;
  const over = goal.direction === "cap" && current > goal.target;
  return `<section class="goal-card" style="--area:${area.color}">
    <h2>${esc(goal.title)}</h2>
    <p class="fine">${esc(periodLabel(goal.period))} · ${goal.direction === "cap" ? "Stay under" : "Build up"}</p>
    <div class="progress-copy">${esc(progressText(goal, current))}</div>
    <div class="bar${over ? " over" : ""}"><i style="width:${Math.round(ratio * 100)}%"></i></div>
    <div class="actions" style="margin-top:12px">
      <button class="btn secondary" type="button" data-action="toggle-goal">Edit goal</button>
      <button class="btn ghost" type="button" data-action="delete-goal" data-area="${area.id}">Remove</button>
    </div>
    ${goalForm(area, goal)}
  </section>`;
}

function suggestionLabel(area) {
  const goal = area.suggest;
  return `Start: ${goal.title} ${formatNum(goal.target, goal.unit)}`;
}

function goalForm(area, goal = null) {
  const numeric = area.fields.filter((field) => field.type === "number");
  const modeValue = goal ? modeValueOf(goal) : modeValueOf(area.suggest);
  const modes = [
    ...numeric.flatMap((field) => [
      [`sum:${field.key}`, `Add up ${field.label.toLowerCase()}`],
      [`avg:${field.key}`, `Average ${field.label.toLowerCase()}`]
    ]),
    ["count", "Days I check in"],
    ["manual", "I will type the progress"]
  ];
  const modeOptions = modes.map(([value, label]) => `<option value="${esc(value)}"${value === modeValue ? " selected" : ""}>${esc(label)}</option>`).join("");
  const periods = [["day", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"]];
  const period = goal?.period || area.suggest.period;
  const direction = goal?.direction || area.suggest.direction;
  const showKind = area.id === "budget";
  const kind = goal?.metricWhen?.kind || area.suggest.metricWhen?.kind || "";
  return `<form id="goal-form" class="stack" style="margin-top:14px" ${ui.goalOpen ? "" : "hidden"}>
    <label class="field"><span>Name</span><input name="title" maxlength="40" value="${esc(goal?.title || area.suggest.title)}" required></label>
    <label class="field"><span>Target</span><input name="target" type="number" inputmode="decimal" min="0" step="0.1" value="${esc(goal?.target ?? area.suggest.target)}" required></label>
    <label class="field"><span>Unit</span><input name="unit" maxlength="16" value="${esc(goal?.unit || area.suggest.unit)}"></label>
    <label class="field"><span>Track</span><select name="mode">${modeOptions}</select></label>
    ${showKind ? `<label class="field"><span>Amounts</span><select name="kind">
      <option value=""${!kind ? " selected" : ""}>All amounts</option>
      <option value="Expense"${kind === "Expense" ? " selected" : ""}>Expenses only</option>
      <option value="Income"${kind === "Income" ? " selected" : ""}>Income only</option>
    </select></label>` : ""}
    <label class="field"><span>Time</span><select name="period">${periods.map(([value, label]) => `<option value="${value}"${value === period ? " selected" : ""}>${label}</option>`).join("")}</select></label>
    <label class="field"><span>Direction</span><select name="direction">
      <option value="up"${direction !== "cap" ? " selected" : ""}>More is better</option>
      <option value="cap"${direction === "cap" ? " selected" : ""}>Stay under the target</option>
    </select></label>
    <label class="field"><span>Typed progress</span><input name="manualValue" type="number" inputmode="decimal" min="0" step="0.1" value="${esc(goal?.manualValue ?? "")}" placeholder="Only used if you type progress"></label>
    <button class="btn full" type="submit">Save goal</button>
  </form>`;
}

function modeValueOf(goal) {
  if (!goal || goal.mode === "count") return "count";
  if (goal.mode === "manual") return "manual";
  return `${goal.mode}:${goal.metric}`;
}

function renderEntry(entry) {
  const area = areaById(entry.area);
  const summary = summarize(area, entry.fields);
  const photo = safePhoto(entry.photo);
  const pending = ui.pendingDelete === entry.id;
  return `<article class="feed-item">
    <span class="fine">${esc(formatDay(entry.date))}</span>
    <div>
    ${summary ? `<div class="feed-title">${esc(summary)}</div>` : `<div class="feed-title">${entry.checked ? "Checked in" : "Note"}</div>`}
    ${entry.note ? `<p>${esc(entry.note)}</p>` : ""}
    ${photo ? `<button type="button" data-action="lightbox" data-photo="1" aria-label="View photo"><img class="thumb" alt="" src="${photo}"></button>` : ""}
    <div class="row-actions" style="margin-top:10px">
      <button class="btn ghost" type="button" data-action="edit" data-id="${esc(entry.id)}">Edit</button>
      ${pending
        ? `<button class="btn danger" type="button" data-action="confirm-delete" data-id="${esc(entry.id)}">Delete entry</button>
           <button class="btn ghost" type="button" data-action="cancel-delete">Keep</button>`
        : `<button class="btn ghost" type="button" data-action="ask-delete" data-id="${esc(entry.id)}">Delete</button>`}
    </div>
    </div>
  </article>`;
}

function renderMe() {
  const bytes = JSON.stringify(snapshot()).length;
  const ratio = Math.min(bytes / STORAGE_LIMIT, 1);
  const started = state.profile.createdAt ? formatFull(state.profile.createdAt) : "today";
  return `<p class="lede">This space belongs to this phone and browser. A friend who opens your link starts empty, with their own name.</p>
    <section class="panel stack">
      <h2>Name</h2>
      <label class="field"><span>Shown on your home screen</span><input id="profile-name" maxlength="24" value="${esc(state.profile.name)}"></label>
      <button class="btn" type="button" data-action="save-name">Save name</button>
    </section>
    <section class="panel" style="margin-top:12px">
      <h2>Storage</h2>
      <p class="fine">${entriesWord()} · about ${formatBytes(bytes)} of ${formatBytes(STORAGE_LIMIT)}</p>
      <div class="storage"><i style="width:${Math.round(ratio * 100)}%"></i></div>
      <p class="fine">Photos are the heavy part. The browser may stop saving before this bar fills.</p>
    </section>
    <section class="panel" style="margin-top:12px">
      <h2>Share</h2>
      <p class="fine">The link opens this same website. It does not include your notes or photos.</p>
      <button class="btn" type="button" data-action="share" style="margin-top:12px">Share the website link</button>
      <p class="fine" style="margin-top:12px">Space started ${esc(started)}.</p>
    </section>
    <section class="panel" style="margin-top:12px">
      <h2>Clear this phone</h2>
      <p class="fine">Removes your name, logs, goals, and photos from this browser.</p>
      ${ui.confirmClear
        ? `<div class="actions" style="margin-top:12px"><button class="btn danger" type="button" data-action="confirm-clear">Yes, delete everything</button><button class="btn ghost" type="button" data-action="cancel-clear">Cancel</button></div>`
        : `<button class="btn danger" type="button" data-action="ask-clear" style="margin-top:12px">Clear this space</button>`}
    </section>`;
}

function entriesWord() {
  const count = state.entries.length;
  const photos = state.entries.filter((entry) => entry.photo).length;
  return `${count} ${count === 1 ? "entry" : "entries"}, ${photos} ${photos === 1 ? "photo" : "photos"}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

function shareSheet() {
  if (!ui.shareUrl) return "";
  return `<section class="share-sheet">
    <h2 class="block-title">Website link</h2>
    <p class="fine">Your friend opens this on their phone and creates their own space. Your notes stay here.</p>
    <label class="field" style="margin:12px 0"><span>Link</span><input id="share-url" readonly value="${esc(ui.shareUrl)}"></label>
    <div class="actions">
      <button class="btn" type="button" data-action="copy-link">Copy link</button>
      <button class="btn ghost" type="button" data-action="close-share">Close</button>
    </div>
  </section>`;
}

function lightbox() {
  const src = safePhoto(ui.lightbox);
  if (!src) return "";
  return `<div class="lightbox" data-action="close-lightbox" role="dialog" aria-label="Photo"><img alt="Saved photo" src="${src}"></div>`;
}

function captureDraft() {
  if (!captureEnabled) return;
  const entryForm = document.getElementById("entry-form");
  if (entryForm) {
    ui.draft = Object.fromEntries(new FormData(entryForm).entries());
    ui.draftArea = entryForm.dataset.area || "";
  }
  const goalFormEl = document.getElementById("goal-form");
  if (goalFormEl && !goalFormEl.hidden) {
    ui.goalDraft = Object.fromEntries(new FormData(goalFormEl).entries());
  }
}

function fillForm(form, data) {
  if (!form || !data) return;
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field || field instanceof RadioNodeList) return;
    field.value = value;
  });
}

function restoreDraft() {
  const entryForm = document.getElementById("entry-form");
  if (entryForm && ui.draft && ui.draftArea === entryForm.dataset.area) fillForm(entryForm, ui.draft);
  const goalFormEl = document.getElementById("goal-form");
  if (goalFormEl && ui.goalOpen) {
    goalFormEl.hidden = false;
    fillForm(goalFormEl, ui.goalDraft);
  }
  paintPhoto();
}

function paintPhoto() {
  const wrap = document.getElementById("photo-preview");
  const image = document.getElementById("photo-preview-img");
  const src = safePhoto(ui.photoDraft);
  if (!wrap || !image) return;
  if (!src) {
    wrap.hidden = true;
    image.removeAttribute("src");
    return;
  }
  wrap.hidden = false;
  image.src = src;
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Try a JPEG."));
    };
    image.src = url;
  });
}

async function compressPhoto(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose a photo under 15 MB.");
  const image = await loadImage(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.72;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > 180000 && quality > 0.42) {
    quality -= 0.08;
    data = canvas.toDataURL("image/jpeg", quality);
  }
  if (!data.startsWith("data:image/jpeg;base64,") || data.length > 400000) {
    throw new Error("That photo is still too large.");
  }
  return data;
}

function toggleToday(areaId) {
  const today = todayIso();
  const todays = state.entries.filter((entry) => entry.area === areaId && entry.date === today);
  const turningOff = todays.some((entry) => entry.checked);
  const ok = mutate(() => {
    if (!turningOff) {
      if (!todays.length) {
        state.entries.unshift({
          id: uid(),
          area: areaId,
          date: today,
          checked: true,
          note: "",
          fields: {},
          photo: "",
          createdAt: new Date().toISOString()
        });
        return;
      }
      state.entries = state.entries.map((entry) => (
        entry.area === areaId && entry.date === today ? { ...entry, checked: true } : entry
      ));
      return;
    }
    state.entries = state.entries.flatMap((entry) => {
      if (entry.area !== areaId || entry.date !== today) return [entry];
      if (isBlank(entry)) return [];
      return [{ ...entry, checked: false }];
    });
  });
  if (ok) render({ keepDraft: true });
}

function readEntry(area, form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const fields = {};
  area.fields.forEach((field) => {
    fields[field.key] = String(data[field.key] ?? "").trim();
  });
  const note = String(data.note || "").trim();
  const date = data.date || todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayIso()) {
    toast("Choose today or an earlier date.");
    return null;
  }
  const hasNumber = area.fields.some((field) => field.type === "number" && fields[field.key] !== "");
  const hasText = area.fields.some((field) => field.type !== "number" && field.type !== "select" && fields[field.key] !== "");
  if (!note && !hasNumber && !hasText && !safePhoto(ui.photoDraft) && !ui.editingId) {
    toast("Add a number, a note, or a photo.");
    return null;
  }
  return { date, note, fields };
}

function saveEntry(area, form) {
  const parsed = readEntry(area, form);
  if (!parsed) return;
  const photo = safePhoto(ui.photoDraft);
  const ok = mutate(() => {
    if (ui.editingId) {
      state.entries = state.entries.map((entry) => entry.id === ui.editingId ? {
        ...entry,
        date: parsed.date,
        note: parsed.note,
        fields: parsed.fields,
        photo,
        checked: true
      } : entry);
      return;
    }
    state.entries = state.entries.filter((entry) => !(entry.area === area.id && entry.date === parsed.date && isBlank(entry)));
    state.entries.unshift({
      id: uid(),
      area: area.id,
      date: parsed.date,
      checked: true,
      note: parsed.note,
      fields: parsed.fields,
      photo,
      createdAt: new Date().toISOString()
    });
  });
  if (!ok) return;
  ui.draft = null;
  ui.photoDraft = "";
  ui.editingId = "";
  ui.logOpen = false;
  render({ keepDraft: false });
  toast("Saved on this phone.");
}

function saveGoal(area, form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const target = Number(data.target);
  if (!data.title.trim() || !Number.isFinite(target) || target <= 0) {
    toast("Add a name and a target above zero.");
    return;
  }
  const [mode, metric] = data.mode === "count" || data.mode === "manual" ? [data.mode, ""] : data.mode.split(":");
  const goal = {
    id: goalFor(area.id)?.id || uid(),
    area: area.id,
    title: data.title.trim().slice(0, 40),
    target,
    unit: data.unit.trim().slice(0, 16),
    mode,
    metric,
    period: data.period,
    direction: data.direction === "cap" ? "cap" : "up",
    manualValue: data.manualValue === "" ? 0 : Number(data.manualValue) || 0,
    metricWhen: area.id === "budget" && data.kind ? { kind: data.kind } : null
  };
  const ok = mutate(() => {
    state.goals = state.goals.filter((item) => item.area !== area.id).concat(goal);
  });
  if (!ok) return;
  ui.goalOpen = false;
  ui.goalDraft = null;
  render({ keepDraft: true });
  toast("Goal saved.");
}

async function onPhoto(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  try {
    ui.photoDraft = await compressPhoto(file);
    paintPhoto();
  } catch (error) {
    toast(error.message || "Could not add that photo.");
  }
}

async function shareSite() {
  const url = shareLink();
  const text = "Make your own goals space on your phone. Notes and photos stay on the device you use.";
  if (navigator.share) {
    try {
      await navigator.share({ title: "Goals", text, url });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }
  ui.shareUrl = url;
  render({ keepDraft: true });
}

let captureEnabled = true;

const renderBase = render;
render = function patchedRender(options = {}) {
  const keep = options.keepDraft !== false;
  if (!keep) {
    ui.draft = null;
    ui.goalDraft = null;
  }
  captureEnabled = keep && options.capture !== false;
  renderBase();
  captureEnabled = true;
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "close-lightbox" && event.target.tagName === "IMG") return;
  if (button.dataset.action === "hold") return;
  const action = button.dataset.action;
  const areaId = button.dataset.area || route().area?.id;

  if (action === "open-log") {
    ui.logOpen = true;
    ui.editingId = "";
    ui.draft = null;
    ui.photoDraft = "";
    render({ keepDraft: false });
  }
  if (action === "close-log") {
    ui.logOpen = false;
    ui.editingId = "";
    ui.draft = null;
    ui.photoDraft = "";
    render({ keepDraft: false });
  }
  if (action === "toggle-today") toggleToday(areaId);
  if (action === "share") shareSite();
  if (action === "close-share") {
    ui.shareUrl = "";
    render({ keepDraft: true });
  }
  if (action === "copy-link") {
    const url = document.getElementById("share-url")?.value || shareLink();
    const field = document.getElementById("share-url");
    const legacyCopy = () => {
      if (!field) return false;
      field.focus();
      field.select();
      return document.execCommand("copy");
    };
    const done = () => toast("Link copied.");
    const fail = () => toast("Select the link and copy it.");
    const tryLegacy = () => {
      try {
        if (legacyCopy()) done();
        else fail();
      } catch {
        fail();
      }
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done).catch(tryLegacy);
    else tryLegacy();
  }
  if (action === "toggle-goal") {
    ui.goalOpen = !ui.goalOpen;
    render({ keepDraft: true });
  }
  if (action === "use-suggestion") {
    const area = areaById(areaId);
    const ok = mutate(() => {
      state.goals = state.goals.filter((goal) => goal.area !== area.id).concat({ id: uid(), area: area.id, manualValue: 0, metricWhen: null, ...area.suggest });
    });
    if (ok) {
      ui.goalOpen = false;
      render({ keepDraft: true });
      toast("Goal started.");
    }
  }
  if (action === "delete-goal") {
    const ok = mutate(() => {
      state.goals = state.goals.filter((goal) => goal.area !== areaId);
    });
    if (ok) render({ keepDraft: true });
  }
  if (action === "clear-photo") {
    ui.photoDraft = "";
    paintPhoto();
  }
  if (action === "edit") {
    const entry = state.entries.find((item) => item.id === button.dataset.id);
    if (!entry) return;
    ui.editingId = entry.id;
    ui.draft = { date: entry.date, note: entry.note || "", ...entry.fields };
    ui.draftArea = entry.area;
    ui.photoDraft = safePhoto(entry.photo);
    ui.pendingDelete = "";
    ui.logOpen = true;
    render({ keepDraft: true, capture: false });
    document.getElementById("entry-form")?.scrollIntoView({ block: "start" });
  }
  if (action === "cancel-edit") {
    ui.editingId = "";
    ui.draft = null;
    ui.photoDraft = "";
    ui.logOpen = false;
    render({ keepDraft: false });
  }
  if (action === "ask-delete") {
    ui.pendingDelete = button.dataset.id;
    render({ keepDraft: true });
  }
  if (action === "cancel-delete") {
    ui.pendingDelete = "";
    render({ keepDraft: true });
  }
  if (action === "confirm-delete") {
    const ok = mutate(() => {
      state.entries = state.entries.filter((entry) => entry.id !== button.dataset.id);
    });
    if (!ok) return;
    if (ui.editingId === button.dataset.id) {
      ui.editingId = "";
      ui.photoDraft = "";
      ui.draft = null;
    }
    ui.pendingDelete = "";
    render({ keepDraft: ui.editingId !== "" });
  }
  if (action === "lightbox") {
    const image = button.querySelector("img");
    ui.lightbox = image ? image.getAttribute("src") : "";
    render({ keepDraft: true });
  }
  if (action === "close-lightbox") {
    ui.lightbox = "";
    render({ keepDraft: true });
  }
  if (action === "save-name") {
    const name = document.getElementById("profile-name")?.value.trim().slice(0, 24);
    if (!name) return toast("Add a name.");
    const ok = mutate(() => {
      state.profile.name = name;
    });
    if (ok) {
      render({ keepDraft: false });
      toast("Name saved.");
    }
  }
  if (action === "ask-clear") {
    ui.confirmClear = true;
    render({ keepDraft: false });
  }
  if (action === "cancel-clear") {
    ui.confirmClear = false;
    render({ keepDraft: false });
  }
  if (action === "confirm-clear") {
    applySnapshot(blank());
    localStorage.removeItem(STORAGE_KEY);
    ui = freshUi();
    location.hash = "";
    render({ keepDraft: false });
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.id === "welcome-form") {
    event.preventDefault();
    const name = String(new FormData(form).get("name") || "").trim().slice(0, 24);
    if (!name) return toast("Add a name.");
    const ok = mutate(() => {
      state.profile = { name, createdAt: new Date().toISOString() };
    });
    if (ok) render({ keepDraft: false });
  }
  if (form.id === "entry-form") {
    event.preventDefault();
    const area = areaById(form.dataset.area);
    if (area) saveEntry(area, form);
  }
  if (form.id === "goal-form") {
    event.preventDefault();
    const area = route().area;
    if (area) saveGoal(area, form);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "photo-input") onPhoto(event.target);
});

window.addEventListener("hashchange", () => {
  ui.draft = null;
  ui.photoDraft = "";
  ui.editingId = "";
  ui.goalOpen = false;
  ui.goalDraft = null;
  ui.pendingDelete = "";
  ui.shareUrl = "";
  ui.lightbox = "";
  ui.logOpen = false;
  render({ keepDraft: false });
});

render({ keepDraft: false });
