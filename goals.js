// Guided pages for the three goals that used to be a blank log:
//   Sleep   - a bedtime worked out from your wake-up time, and a one-step nightly log
//   Budget  - one weekly spending amount, and what is left of it
//   Running - a weekly goal in distance or time, and one field to add a run
// Loaded before app.js. app.js calls Goals.page() from renderArea() and Goals.stat()
// from rowStat(); everything here leans on app.js globals (state, mutate, render,
// toast, esc, ui, todayIso and the time helpers) only at call time, which is why
// load() below checks the saved time itself instead of calling a helper.
// Logs are ordinary entries, so check-ins, streaks, storage and "Clear this space"
// keep working. Only the settings (bedtime, weekly amount, running goal) live here.
(function () {
  const KEY = "goals-space-plans-v1";
  const NUTRITION_KEY = "goals-space-nutrition-v1";
  const IDS = ["sleep", "budget", "running"];

  const SLEEP_HOURS = [7, 7.5, 8, 8.5, 9];
  const FEELS = ["Great", "Okay", "Rough"];
  const WEEKLY_PICKS = [50, 75, 100, 150];
  const CATEGORIES = ["Groceries", "Eating out", "Gas", "Fun", "Other"];
  const RUN_MODES = {
    miles: { name: "Distance", label: "Miles", unit: "mi", picks: [3, 6, 9, 12], step: "0.01", placeholder: "1.5" },
    minutes: { name: "Time", label: "Minutes", unit: "min", picks: [30, 60, 90, 120], step: "1", placeholder: "20" }
  };

  let store = load();
  let local = freshLocal();

  function freshLocal() {
    return { sleepLog: false, sleepSetup: false, sleepDraft: null, budgetSetup: false, budgetDraft: null, runSetup: false, runMode: "" };
  }

  function load() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { data = {}; }
    const hours = Number(data.sleep?.hours);
    const weekly = Number(data.budget?.weekly);
    const runGoal = Number(data.run?.goal);
    const runMode = data.run?.mode === "minutes" ? "minutes" : "miles";
    return {
      sleep: {
        set: Boolean(data.sleep?.set),
        wake: /^\d{2}:\d{2}$/.test(String(data.sleep?.wake || "")) ? String(data.sleep.wake) : "07:30",
        hours: SLEEP_HOURS.includes(hours) ? hours : 8
      },
      budget: { weekly: Number.isFinite(weekly) && weekly > 0 ? Math.min(weekly, 100000) : 0 },
      run: Number.isFinite(runGoal) && runGoal > 0 ? { mode: runMode, goal: Math.min(runGoal, 10000) } : { mode: "", goal: 0 },
      cartSig: typeof data.cartSig === "string" ? data.cartSig.slice(0, 4000) : ""
    };
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      return true;
    } catch {
      toast("Could not save on this phone. Allow site storage and try again.");
      return false;
    }
  }

  function has(id) {
    return IDS.includes(id);
  }

  function pick(action, value, label, on) {
    return `<button class="pick" type="button" data-gl="${action}" data-value="${esc(value)}" aria-pressed="${Boolean(on)}">${esc(label)}</button>`;
  }

  function addDays(iso, days) {
    const date = parseDate(iso);
    date.setDate(date.getDate() + days);
    return todayIso(date);
  }

  function newestFirst(a, b) {
    return (b.date + String(b.createdAt)).localeCompare(a.date + String(a.createdAt));
  }

  function recentList(entries, describe, emptyText) {
    if (!entries.length) return `<p class="fine">${esc(emptyText)}</p>`;
    const rows = entries.slice(0, 14).map((entry) => {
      const pending = ui.pendingDelete === entry.id;
      const [title, detail] = describe(entry);
      return `<article class="feed-item">
        <span class="fine">${esc(formatDay(entry.date))}</span>
        <div>
          <div class="feed-title">${esc(title)}</div>
          ${detail ? `<p class="fine">${esc(detail)}</p>` : ""}
          <div class="row-actions" style="margin-top:8px">
            ${pending
              ? `<button class="btn danger" type="button" data-action="confirm-delete" data-id="${esc(entry.id)}">Delete it</button>
                 <button class="btn ghost" type="button" data-action="cancel-delete">Keep</button>`
              : `<button class="btn ghost" type="button" data-action="ask-delete" data-id="${esc(entry.id)}">Delete</button>`}
          </div>
        </div>
      </article>`;
    }).join("");
    return `<div class="feed">${rows}</div>`;
  }

  /* ---------- Sleep ---------- */

  function shiftTime(time, minutes) {
    const total = (Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes + 2880) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function bedtime() {
    return shiftTime(store.sleep.wake, -Math.round(store.sleep.hours * 60));
  }

  function sleepMinutes(entry) {
    const fromTimes = minutesBetween(entry.fields?.bed, entry.fields?.wake);
    if (fromTimes != null) return fromTimes;
    const hours = numberFrom(entry, "hours");
    return hours == null ? null : Math.round(hours * 60);
  }

  function sleepNights() {
    return entriesFor("sleep").filter((entry) => sleepMinutes(entry) != null).sort(newestFirst);
  }

  function nightOn(iso) {
    return sleepNights().find((entry) => entry.date === iso) || null;
  }

  function onTarget(minutes) {
    return minutes >= store.sleep.hours * 60 - 30;
  }

  function sleepSetupCard() {
    const hours = SLEEP_HOURS.map((value) => pick("sleep-hours", value, `${value} h`, store.sleep.hours === value)).join("");
    return `<section class="panel stack">
      <h2>${store.sleep.set ? "Change your schedule" : "Set your bedtime"}</h2>
      <p class="fine">Pick when you get up. The app works out when to be in bed.</p>
      <form class="stack" data-gl-form="sleep-setup" autocomplete="off">
        <label class="field"><span>I wake up at</span><input type="time" name="wake" value="${esc(store.sleep.wake)}" required></label>
        <div class="field"><span>Sleep I want</span><div class="day-picks">${hours}</div></div>
        <p class="gl-result">In bed by <strong data-gl-bed>${esc(clockText(bedtime()))}</strong></p>
        <button class="btn full" type="submit">${store.sleep.set ? "Save" : "Set my bedtime"}</button>
      </form>
      <p class="fine">Most adults do best on 7 to 9 hours. 8 is a good place to start.</p>
    </section>`;
  }

  function sleepLogCard() {
    const today = todayIso();
    const draft = local.sleepDraft || {};
    const existing = nightOn(draft.date || today);
    const bed = draft.bed || existing?.fields?.bed || bedtime();
    const wake = draft.wake || existing?.fields?.wake || store.sleep.wake;
    const feel = draft.feel || existing?.fields?.quality || "Okay";
    const feels = FEELS.map((value) => pick("sleep-feel", value, value, feel === value)).join("");
    return `<section class="panel stack">
      <h2>Log a night</h2>
      <form class="stack" data-gl-form="sleep-log" autocomplete="off">
        <label class="field"><span>Morning you woke up</span><input type="date" name="date" max="${today}" value="${esc(draft.date || today)}" required></label>
        <div class="time-pair">
          <label class="field"><span>Went to bed</span><input type="time" name="bed" value="${esc(bed)}" required></label>
          <label class="field"><span>Woke up</span><input type="time" name="wake" value="${esc(wake)}" required></label>
        </div>
        <div class="field"><span>How it felt</span><div class="day-picks">${feels}</div></div>
        <button class="btn full" type="submit">Save night</button>
        <button class="btn ghost full" type="button" data-gl="sleep-close-log">Cancel</button>
      </form>
    </section>`;
  }

  function sleepChart() {
    const today = todayIso();
    const top = 10 * 60;
    const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
    const bars = days.map((iso) => {
      const night = nightOn(iso);
      const minutes = night ? sleepMinutes(night) : null;
      const height = minutes == null ? 0 : Math.max(6, Math.min(100, Math.round(minutes / top * 100)));
      const label = parseDate(iso).toLocaleDateString(undefined, { weekday: "narrow" });
      const value = minutes == null ? "" : String(Math.round(minutes / 6) / 10);
      return `<div class="gl-day${iso === today ? " today" : ""}">
        <span class="gl-day-val">${esc(value)}</span>
        <div class="gl-col"><i class="${minutes != null && onTarget(minutes) ? "hit" : ""}" style="height:${height}%"></i></div>
        <span class="gl-day-name">${esc(label)}</span>
      </div>`;
    }).join("");
    const line = Math.round(store.sleep.hours * 60 / top * 100);
    return `<div class="gl-chart" role="img" aria-label="Hours slept on each of the last 7 nights" style="--gl-line:${line}%">${bars}</div>`;
  }

  function sleepPage() {
    if (!store.sleep.set) {
      return `<section class="hero">
          <p class="kicker">Sleep</p>
          <p class="hero-stat">Start with a bedtime</p>
          <p class="fine">Lifting only pays off if you sleep. One target, and a ten second log each morning.</p>
        </section>
        ${sleepSetupCard()}`;
    }
    const today = todayIso();
    const nights = sleepNights();
    const last = nightOn(today);
    const week = nights.filter((entry) => entry.date > addDays(today, -7));
    const minutes = week.map(sleepMinutes);
    const avg = minutes.length ? Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length) : null;
    const hits = minutes.filter(onTarget).length;
    const windDown = shiftTime(bedtime(), -30);
    const action = local.sleepLog ? sleepLogCard() : local.sleepSetup ? sleepSetupCard()
      : `<button class="btn full" type="button" data-gl="sleep-open-log">${last ? "Change last night" : "Log last night"}</button>`;
    return `<section class="hero">
        <p class="kicker">In bed tonight by</p>
        <p class="hero-stat">${esc(clockText(bedtime()))}</p>
        <p class="fine">Up at ${esc(clockText(store.sleep.wake))} for ${esc(formatNum(store.sleep.hours, "h"))} of sleep. Put the phone down around ${esc(clockText(windDown))}.</p>
      </section>
      ${action}
      <div class="snap" style="margin-top:14px">
        <div><span class="fine">Last night</span><strong>${last ? esc(durationText(sleepMinutes(last))) : "Not logged"}</strong></div>
        <div><span class="fine">7 day average</span><strong>${avg == null ? "No nights yet" : esc(durationText(avg))}</strong></div>
      </div>
      <section class="panel">
        <h2>Last 7 nights</h2>
        ${sleepChart()}
        <p class="fine">${week.length ? `${hits} of ${week.length} logged ${week.length === 1 ? "night" : "nights"} within 30 minutes of your ${formatNum(store.sleep.hours, "h")} target.` : "Bars fill in as you log. The line is your target."}</p>
      </section>
      <section class="panel" style="margin-top:12px">
        <h2>Three things that help most</h2>
        <ol class="gl-tips">
          <li>Get up at the same time every day, weekends too.</li>
          <li>No caffeine or pre-workout after 2 PM.</li>
          <li>Phone across the room, not in bed.</li>
        </ol>
      </section>
      ${local.sleepSetup || local.sleepLog ? "" : `<button class="btn ghost" type="button" data-gl="sleep-open-setup" style="margin-top:12px">Change wake-up time</button>`}
      <p class="section-label">Recent</p>
      ${recentList(nights, (entry) => {
        const times = cleanTime(entry.fields?.bed) && cleanTime(entry.fields?.wake) ? `${clockText(entry.fields.bed)} to ${clockText(entry.fields.wake)}` : "";
        return [durationText(sleepMinutes(entry)), [times, entry.fields?.quality].filter(Boolean).join(" · ")];
      }, "No nights logged yet.")}`;
  }

  function readSleepDraft() {
    const form = document.querySelector("[data-gl-form='sleep-log']");
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    local.sleepDraft = { ...(local.sleepDraft || {}), date: data.date, bed: data.bed, wake: data.wake };
  }

  function saveNight(form) {
    readSleepDraft();
    const draft = local.sleepDraft || {};
    const date = draft.date || todayIso();
    const bed = cleanTime(draft.bed);
    const wake = cleanTime(draft.wake);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayIso()) return toast("Choose today or an earlier morning.");
    if (!bed || !wake) return toast("Add both times.");
    const minutes = minutesBetween(bed, wake);
    if (!minutes) return toast("Those two times are the same.");
    if (minutes > 16 * 60) return toast("That is over 16 hours. Check the two times.");
    const feel = FEELS.includes(draft.feel) ? draft.feel : (nightOn(date)?.fields?.quality || "Okay");
    const ok = mutate(() => {
      state.entries = state.entries.filter((entry) => !(entry.area === "sleep" && entry.date === date && (isBlank(entry) || sleepMinutes(entry) != null)));
      state.entries.unshift({
        id: uid(),
        area: "sleep",
        date,
        checked: true,
        note: "",
        fields: { hours: String(Math.round(minutes / 6) / 10), quality: feel, bed, wake },
        photo: "",
        createdAt: new Date().toISOString()
      });
    });
    if (!ok) return;
    local.sleepLog = false;
    local.sleepDraft = null;
    render({ keepDraft: false });
    toast(onTarget(minutes) ? `Saved. ${durationText(minutes)}, on target.` : `Saved. ${durationText(minutes)}.`);
  }

  /* ---------- Budget ---------- */

  function weekStart(iso = todayIso()) {
    const date = parseDate(iso);
    return addDays(iso, -((date.getDay() + 6) % 7));
  }

  function expenses() {
    return entriesFor("budget").filter((entry) => entry.fields?.kind !== "Income" && numberFrom(entry, "amount") != null).sort(newestFirst);
  }

  function spentBetween(from, to) {
    return expenses().filter((entry) => entry.date >= from && entry.date <= to).reduce((sum, entry) => sum + numberFrom(entry, "amount"), 0);
  }

  // The grocery list from the Nutrition page, when that page has one on this phone.
  function groceryList() {
    try {
      const data = JSON.parse(localStorage.getItem(NUTRITION_KEY) || "null");
      const items = Array.isArray(data?.items) ? data.items.filter((item) => item && item.name) : [];
      if (!items.length) return null;
      const priced = (list) => list.reduce((sum, item) => sum + (Number.isFinite(Number(item.price)) && item.price != null ? Number(item.price) : 0), 0);
      const left = items.filter((item) => !item.done);
      const cart = items.filter((item) => item.done);
      return {
        leftCount: left.length,
        leftTotal: priced(left),
        cartCount: cart.length,
        cartTotal: priced(cart),
        cartSig: cart.map((item) => String(item.id || item.name)).sort().join("|").slice(0, 4000)
      };
    } catch {
      return null;
    }
  }

  function budgetSetupCard() {
    const picks = WEEKLY_PICKS.map((value) => pick("budget-weekly", value, `$${value}`, store.budget.weekly === value)).join("");
    return `<section class="panel stack">
      <h2>${store.budget.weekly ? "Change your weekly amount" : "Pick a weekly amount"}</h2>
      <p class="fine">Money you can spend in a week on food, gas and fun. Leave out bills that never change.</p>
      <div class="day-picks">${picks}</div>
      <form class="gl-inline" data-gl-form="budget-setup" autocomplete="off">
        <label class="field"><span>Or type your own ($)</span><input name="weekly" type="number" inputmode="decimal" min="1" step="1" placeholder="120" value="${store.budget.weekly && !WEEKLY_PICKS.includes(store.budget.weekly) ? esc(store.budget.weekly) : ""}"></label>
        <button class="btn" type="submit">Set</button>
      </form>
      ${store.budget.weekly ? `<button class="btn ghost full" type="button" data-gl="budget-close-setup">Cancel</button>` : ""}
    </section>`;
  }

  function groceryCard(left) {
    const list = groceryList();
    if (!list) return "";
    const fits = list.leftTotal <= Math.max(left, 0);
    const canLog = list.cartCount > 0 && list.cartTotal > 0 && list.cartSig !== store.cartSig;
    return `<section class="panel" style="margin-top:12px">
      <h2>Grocery list</h2>
      <p class="fine">${list.leftCount
        ? `${list.leftCount} ${list.leftCount === 1 ? "item" : "items"} left to buy, about ${formatNum(list.leftTotal, "$")}. ${fits ? "That fits in what is left this week." : `That is ${formatNum(list.leftTotal - Math.max(left, 0), "$")} more than you have left this week.`}`
        : "Everything on your list is in the cart."}</p>
      <div class="actions" style="margin-top:12px">
        ${canLog ? `<button class="btn" type="button" data-gl="budget-log-cart">Add cart as spent, ${esc(formatNum(list.cartTotal, "$"))}</button>` : ""}
        <a class="btn secondary" href="#/area/nutrition">Open the list</a>
      </div>
    </section>`;
  }

  function budgetPage() {
    if (!store.budget.weekly) {
      return `<section class="hero">
          <p class="kicker">Budget</p>
          <p class="hero-stat">One number a week</p>
          <p class="fine">Pick what you can spend each week. Add what you spend, and the app shows what is left.</p>
        </section>
        ${budgetSetupCard()}`;
    }
    const today = todayIso();
    const start = weekStart(today);
    const end = addDays(start, 6);
    const weekly = store.budget.weekly;
    const spent = spentBetween(start, end);
    const left = weekly - spent;
    const daysLeft = Math.round((parseDate(end) - parseDate(today)) / 86400000) + 1;
    const perDay = left > 0 ? left / daysLeft : 0;
    const lastSpent = spentBetween(addDays(start, -7), addDays(start, -1));
    const draft = local.budgetDraft || {};
    const category = CATEGORIES.includes(draft.category) ? draft.category : "Groceries";
    const cats = CATEGORIES.map((value) => pick("budget-cat", value, value, category === value)).join("");
    const thisWeek = expenses().filter((entry) => entry.date >= start && entry.date <= end);
    const byCat = new Map();
    thisWeek.forEach((entry) => {
      const name = String(entry.fields?.category || "").trim() || "Other";
      byCat.set(name, (byCat.get(name) || 0) + numberFrom(entry, "amount"));
    });
    const catRows = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => `<div class="gl-cat">
        <span>${esc(name)}</span><strong>${esc(formatNum(amount, "$"))}</strong>
        <div class="bar"><i style="width:${Math.round(Math.min(amount / weekly, 1) * 100)}%"></i></div>
      </div>`).join("");
    const lastDay = parseDate(end).toLocaleDateString(undefined, { weekday: "long" });
    return `<section class="hero">
        <p class="kicker">${left < 0 ? "Over this week" : "Left this week"}</p>
        <p class="hero-stat${left < 0 ? " gl-over" : ""}">${esc(formatNum(Math.abs(left), "$"))}</p>
        <p class="fine">${esc(formatNum(spent, "$"))} spent of ${esc(formatNum(weekly, "$"))}. ${left > 0 ? `About ${esc(formatNum(Math.floor(perDay), "$"))} a day through ${esc(lastDay)}.` : `Resets after ${esc(lastDay)}.`}</p>
        <div class="bar${left < 0 ? " over" : ""}" style="margin-top:12px"><i style="width:${Math.round(Math.min(spent / weekly, 1) * 100)}%"></i></div>
      </section>
      ${local.budgetSetup ? budgetSetupCard() : `<section class="panel stack">
        <h2>Add spending</h2>
        <form class="stack" data-gl-form="budget-add" autocomplete="off">
          <label class="field"><span>Amount ($)</span><input name="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" value="${esc(draft.amount || "")}" required></label>
          <div class="field"><span>What for</span><div class="day-picks">${cats}</div></div>
          <button class="btn full" type="submit">Add</button>
        </form>
      </section>`}
      ${groceryCard(left)}
      <section class="panel" style="margin-top:12px">
        <h2>This week</h2>
        ${catRows || `<p class="fine">Nothing spent yet this week.</p>`}
        <p class="fine" style="margin-top:10px">Last week: ${esc(formatNum(lastSpent, "$"))} of ${esc(formatNum(weekly, "$"))}.</p>
      </section>
      ${local.budgetSetup ? "" : `<button class="btn ghost" type="button" data-gl="budget-open-setup" style="margin-top:12px">Change weekly amount</button>`}
      <p class="section-label">Recent</p>
      ${recentList(expenses(), (entry) => [formatNum(numberFrom(entry, "amount"), "$"), [String(entry.fields?.category || "").trim() || "Other", entry.note].filter(Boolean).join(" · ")], "Nothing added yet.")}`;
  }

  function addExpense(amount, category, note = "") {
    const ok = mutate(() => {
      const today = todayIso();
      state.entries = state.entries.filter((entry) => !(entry.area === "budget" && entry.date === today && isBlank(entry)));
      state.entries.unshift({
        id: uid(),
        area: "budget",
        date: today,
        checked: true,
        note,
        fields: { kind: "Expense", amount: String(Math.round(amount * 100) / 100), category },
        photo: "",
        createdAt: new Date().toISOString()
      });
    });
    if (!ok) return false;
    const left = store.budget.weekly - spentBetween(weekStart(), addDays(weekStart(), 6));
    local.budgetDraft = null;
    render({ keepDraft: false });
    toast(left >= 0 ? `Added. ${formatNum(left, "$")} left this week.` : `Added. ${formatNum(-left, "$")} over this week.`);
    return true;
  }

  function readBudgetDraft() {
    const form = document.querySelector("[data-gl-form='budget-add']");
    if (!form) return;
    local.budgetDraft = { ...(local.budgetDraft || {}), amount: String(new FormData(form).get("amount") || "") };
  }

  function setWeekly(value) {
    const weekly = Math.round(Number(value));
    if (!Number.isFinite(weekly) || weekly < 1 || weekly > 100000) return toast("Type an amount above zero.");
    const before = store.budget.weekly;
    store.budget.weekly = weekly;
    if (!save()) {
      store.budget.weekly = before;
      return;
    }
    local.budgetSetup = false;
    render({ keepDraft: false });
    toast(`Weekly amount set to ${formatNum(weekly, "$")}.`);
  }

  /* ---------- Running ---------- */

  function runTotal(from, to) {
    return entriesFor("running").filter((entry) => entry.date >= from && entry.date <= to)
      .reduce((sum, entry) => sum + (numberFrom(entry, store.run.mode) || 0), 0);
  }

  function runs() {
    return entriesFor("running").filter((entry) => numberFrom(entry, "minutes") != null || numberFrom(entry, "miles") != null).sort(newestFirst);
  }

  function runSetupCard() {
    const mode = local.runMode || store.run.mode || "miles";
    const info = RUN_MODES[mode];
    const modes = Object.entries(RUN_MODES).map(([key, item]) => pick("run-mode", key, item.name, mode === key)).join("");
    const picks = info.picks.map((value) => pick("run-goal", value, `${value} ${info.unit}`, store.run.mode === mode && store.run.goal === value)).join("");
    const custom = store.run.mode === mode && store.run.goal && !info.picks.includes(store.run.goal) ? store.run.goal : "";
    return `<section class="panel stack">
      <h2>${store.run.goal ? "Change your goal" : "Pick a weekly goal"}</h2>
      <div class="field"><span>Count my runs by</span><div class="day-picks">${modes}</div></div>
      <div class="field"><span>Each week I want to run</span><div class="day-picks">${picks}</div></div>
      <form class="gl-inline" data-gl-form="run-setup" autocomplete="off">
        <label class="field"><span>Or type your own (${esc(info.unit)})</span><input name="goal" type="number" inputmode="decimal" min="0" step="${info.step}" placeholder="${info.picks[1]}" value="${esc(custom)}"></label>
        <button class="btn" type="submit">Set</button>
      </form>
      ${store.run.goal ? `<button class="btn ghost full" type="button" data-gl="run-close-setup">Cancel</button>` : ""}
    </section>`;
  }

  function runningPage() {
    const all = runs();
    const recent = `<p class="section-label">Recent</p>
      ${recentList(all, (entry) => {
        const bits = [];
        const miles = numberFrom(entry, "miles");
        const minutes = numberFrom(entry, "minutes");
        if (miles != null) bits.push(formatNum(miles, "mi"));
        if (minutes != null) bits.push(formatNum(minutes, "min"));
        return [bits.join(" · "), entry.note || ""];
      }, "No runs added yet.")}`;
    if (!store.run.goal) {
      return `<section class="hero">
          <p class="kicker">Running</p>
          <p class="hero-stat">Distance or time</p>
          <p class="fine">Pick one way to count your runs and a goal for the week. Then add each run.</p>
        </section>
        ${runSetupCard()}
        ${recent}`;
    }
    const info = RUN_MODES[store.run.mode];
    const start = weekStart();
    const end = addDays(start, 6);
    const goal = store.run.goal;
    const total = runTotal(start, end);
    const count = entriesFor("running").filter((entry) => entry.date >= start && entry.date <= end && numberFrom(entry, store.run.mode) != null).length;
    const last = runTotal(addDays(start, -7), addDays(start, -1));
    const lastDay = parseDate(end).toLocaleDateString(undefined, { weekday: "long" });
    const detail = total >= goal
      ? `Goal of ${formatNum(goal, info.unit)} reached in ${count} ${count === 1 ? "run" : "runs"}.`
      : `${formatNum(goal - total, info.unit)} to go for your ${formatNum(goal, info.unit)} goal by ${lastDay}.`;
    return `<section class="hero">
        <p class="kicker">This week</p>
        <p class="hero-stat">${esc(formatNum(total, info.unit))}</p>
        <p class="fine">${esc(detail)}</p>
        <div class="bar" style="margin-top:12px"><i style="width:${Math.round(Math.min(total / goal, 1) * 100)}%"></i></div>
      </section>
      ${local.runSetup ? runSetupCard() : `<section class="panel stack">
        <h2>Add a run</h2>
        <form class="gl-inline" data-gl-form="run-add" autocomplete="off">
          <label class="field"><span>${esc(info.label)}</span><input name="amount" type="number" inputmode="decimal" min="0" step="${info.step}" placeholder="${info.placeholder}" required></label>
          <button class="btn" type="submit">Add</button>
        </form>
        <p class="fine">Last week: ${esc(formatNum(last, info.unit))}.</p>
      </section>
      <button class="btn ghost" type="button" data-gl="run-open-setup" style="margin-top:12px">Change goal</button>`}
      ${recent}`;
  }

  function setRunGoal(mode, value) {
    const info = RUN_MODES[mode];
    const goal = Math.round(Number(value) * 100) / 100;
    if (!info || !Number.isFinite(goal) || goal <= 0 || goal > 10000) return toast("Type a goal above zero.");
    const before = { ...store.run };
    store.run = { mode, goal };
    if (!save()) {
      store.run = before;
      return;
    }
    local.runSetup = false;
    local.runMode = "";
    render({ keepDraft: false });
    toast(`Goal set: ${formatNum(goal, info.unit)} a week.`);
  }

  function addRun(value) {
    const info = RUN_MODES[store.run.mode];
    const amount = Math.round(Number(value) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) return toast(`Type the ${info.label.toLowerCase()} you ran.`);
    const ok = mutate(() => {
      const today = todayIso();
      state.entries = state.entries.filter((entry) => !(entry.area === "running" && entry.date === today && isBlank(entry)));
      state.entries.unshift({
        id: uid(),
        area: "running",
        date: today,
        checked: true,
        note: "",
        fields: { miles: "", minutes: "", [store.run.mode]: String(amount) },
        photo: "",
        createdAt: new Date().toISOString()
      });
    });
    if (!ok) return;
    const left = store.run.goal - runTotal(weekStart(), addDays(weekStart(), 6));
    render({ keepDraft: false });
    toast(left > 0 ? `Added. ${formatNum(left, info.unit)} to go this week.` : "Added. Weekly goal reached.");
  }

  /* ---------- Wiring ---------- */

  function page(area) {
    const body = area.id === "sleep" ? sleepPage() : area.id === "budget" ? budgetPage() : runningPage();
    return `<div class="gl" style="--area:${area.color}">${body}</div>`;
  }

  // The line shown for each goal on the home list.
  function stat(area) {
    if (area.id === "sleep") {
      if (!store.sleep.set) return { value: "", label: "Set a bedtime" };
      const last = nightOn(todayIso());
      return last ? { value: durationText(sleepMinutes(last)), label: "Last night" } : { value: clockText(bedtime()), label: "Bedtime tonight" };
    }
    if (area.id === "budget") {
      if (!store.budget.weekly) return { value: "", label: "Pick a weekly amount" };
      const left = store.budget.weekly - spentBetween(weekStart(), addDays(weekStart(), 6));
      return { value: formatNum(Math.abs(left), "$"), label: left < 0 ? "Over this week" : "Left this week" };
    }
    if (!store.run.goal) return { value: "", label: "Pick a weekly goal" };
    const info = RUN_MODES[store.run.mode];
    return { value: formatNum(runTotal(weekStart(), addDays(weekStart(), 6)), info.unit), label: `of ${formatNum(store.run.goal, info.unit)} this week` };
  }

  function onClick(button) {
    const action = button.dataset.gl;
    const value = button.dataset.value;

    if (action === "sleep-hours") {
      const wake = cleanTime(document.querySelector("[data-gl-form='sleep-setup'] [name='wake']")?.value);
      if (wake) store.sleep.wake = wake;
      store.sleep.hours = SLEEP_HOURS.includes(Number(value)) ? Number(value) : 8;
      if (store.sleep.set) save();
    }
    if (action === "sleep-open-log") {
      local.sleepLog = true;
      local.sleepSetup = false;
      local.sleepDraft = null;
    }
    if (action === "sleep-close-log") {
      local.sleepLog = false;
      local.sleepDraft = null;
    }
    if (action === "sleep-open-setup") {
      local.sleepSetup = true;
      local.sleepLog = false;
    }
    if (action === "sleep-feel") {
      readSleepDraft();
      local.sleepDraft = { ...(local.sleepDraft || {}), feel: value };
    }

    if (action === "budget-weekly") return setWeekly(value);
    if (action === "budget-open-setup") local.budgetSetup = true;
    if (action === "budget-close-setup") local.budgetSetup = false;
    if (action === "budget-cat") {
      readBudgetDraft();
      local.budgetDraft = { ...(local.budgetDraft || {}), category: value };
    }
    if (action === "budget-log-cart") {
      const list = groceryList();
      if (!list || !list.cartTotal) return;
      // Remember this cart first, so the same items cannot be added twice.
      const before = store.cartSig;
      store.cartSig = list.cartSig;
      if (!save() || !addExpense(list.cartTotal, "Groceries", "From the grocery list")) {
        store.cartSig = before;
        save();
      }
      return;
    }

    if (action === "run-mode") local.runMode = RUN_MODES[value] ? value : "miles";
    if (action === "run-goal") return setRunGoal(local.runMode || store.run.mode || "miles", value);
    if (action === "run-open-setup") local.runSetup = true;
    if (action === "run-close-setup") {
      local.runSetup = false;
      local.runMode = "";
    }
    render({ keepDraft: false });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gl]");
    if (button) return onClick(button);
    // "Clear this space" in app.js wipes the logs; the settings go with them.
    if (event.target.closest("[data-action='confirm-clear']")) {
      try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
      store = load();
      local = freshLocal();
    }
  });

  document.addEventListener("submit", (event) => {
    const kind = event.target.dataset?.glForm;
    if (!kind) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    if (kind === "sleep-setup") {
      const wake = cleanTime(data.wake);
      if (!wake) return toast("Pick a wake-up time.");
      const before = { ...store.sleep };
      store.sleep = { ...store.sleep, wake, set: true };
      if (!save()) {
        store.sleep = before;
        return;
      }
      local.sleepSetup = false;
      render({ keepDraft: false });
      toast(`Bedtime set for ${clockText(bedtime())}.`);
    }
    if (kind === "sleep-log") saveNight(event.target);
    if (kind === "budget-setup") setWeekly(data.weekly);
    if (kind === "budget-add") {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return toast("Type an amount above zero.");
      const category = CATEGORIES.includes(local.budgetDraft?.category) ? local.budgetDraft.category : "Groceries";
      addExpense(amount, category);
    }
    if (kind === "run-setup") setRunGoal(local.runMode || store.run.mode || "miles", data.goal);
    if (kind === "run-add") addRun(data.amount);
  });

  // Keep "In bed by" in step with the wake-up time while it is being picked.
  document.addEventListener("input", (event) => {
    if (!event.target.closest?.("[data-gl-form='sleep-setup']") || event.target.name !== "wake") return;
    const wake = cleanTime(event.target.value);
    const out = document.querySelector("[data-gl-bed]");
    if (wake && out) out.textContent = clockText(shiftTime(wake, -Math.round(store.sleep.hours * 60)));
  });

  window.addEventListener("hashchange", () => {
    local = freshLocal();
    if (!store.sleep.set) store = { ...store, sleep: load().sleep };
  });

  window.Goals = { has, page, stat };
})();
