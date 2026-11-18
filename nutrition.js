// Nutrition extras: simple meals to cook and a grocery list for Walmart and Publix.
// Loaded before app.js. app.js calls Nutrition.page() from renderArea(); everything
// here leans on app.js globals (esc, render, toast, ui, todayIso) only at call time.
(function () {
  const KEY = "goals-space-nutrition-v1";
  const STORES = ["Walmart", "Publix"];
  const SECTIONS = ["Produce", "Meat & deli", "Dairy & eggs", "Bread", "Pantry", "Frozen", "Other"];

  // Every ingredient a recipe can ask for: the name on the list, the aisle, and a starting store.
  const CATALOG = {
    eggs: ["Eggs", "Dairy & eggs", "Walmart"],
    butter: ["Butter", "Dairy & eggs", "Walmart"],
    yogurt: ["Plain Greek yogurt", "Dairy & eggs", "Walmart"],
    milk: ["Milk", "Dairy & eggs", "Walmart"],
    cheese: ["Shredded cheese", "Dairy & eggs", "Walmart"],
    cottage: ["Low-fat cottage cheese", "Dairy & eggs", "Walmart"],
    chicken: ["Chicken breast", "Meat & deli", "Walmart"],
    thighs: ["Boneless chicken thighs", "Meat & deli", "Walmart"],
    turkey: ["Lean ground turkey", "Meat & deli", "Walmart"],
    beef: ["Lean ground beef", "Meat & deli", "Walmart"],
    rotisserie: ["Rotisserie chicken", "Meat & deli", "Publix"],
    bananas: ["Bananas", "Produce", "Publix"],
    apples: ["Apples", "Produce", "Publix"],
    salad: ["Bag salad", "Produce", "Publix"],
    potatoes: ["Potatoes", "Produce", "Walmart"],
    carrots: ["Baby carrots", "Produce", "Walmart"],
    bread: ["Whole wheat bread", "Bread", "Walmart"],
    tortillas: ["Flour tortillas", "Bread", "Walmart"],
    rice: ["Rice", "Pantry", "Walmart"],
    ricepouch: ["Microwave rice pouch", "Pantry", "Walmart"],
    oats: ["Old-fashioned oats", "Pantry", "Walmart"],
    pasta: ["Pasta", "Pantry", "Walmart"],
    marinara: ["Marinara sauce", "Pantry", "Walmart"],
    beans: ["Black beans (can)", "Pantry", "Walmart"],
    tuna: ["Canned tuna in water", "Pantry", "Walmart"],
    pb: ["Peanut butter", "Pantry", "Walmart"],
    granola: ["Granola", "Pantry", "Walmart"],
    honey: ["Honey", "Pantry", "Walmart"],
    oil: ["Olive oil", "Pantry", "Walmart"],
    salsa: ["Salsa", "Pantry", "Walmart"],
    taco: ["Taco seasoning", "Pantry", "Walmart"],
    soy: ["Soy sauce", "Pantry", "Walmart"],
    mayo: ["Light mayo", "Pantry", "Walmart"],
    dressing: ["Light salad dressing", "Pantry", "Walmart"],
    broccoli: ["Frozen broccoli", "Frozen", "Walmart"],
    mixedveg: ["Frozen mixed vegetables", "Frozen", "Walmart"],
    berries: ["Frozen berries", "Frozen", "Walmart"]
  };

  // A first shop that covers most of the meals below for about a week.
  const STARTER = [
    "eggs", "yogurt", "milk", "cheese", "chicken", "turkey", "rotisserie",
    "bananas", "apples", "salad", "bread", "tortillas", "rice", "oats", "pasta",
    "marinara", "beans", "tuna", "pb", "oil", "salsa", "broccoli", "mixedveg", "berries"
  ];

  // Calories and protein are estimates for one serving, rounded. Brands vary.
  const RECIPES = [
    {
      id: "eggs-toast", name: "Scrambled eggs and toast", type: "breakfast", mins: 10, cal: 500, protein: 27,
      blurb: "The first thing worth learning to cook.",
      ingredients: [["3", "eggs"], ["2 slices", "bread"], ["1 teaspoon", "butter"], ["1", "bananas"]],
      steps: [
        "Crack the eggs into a bowl, add a pinch of salt, and beat with a fork.",
        "Melt the butter in a pan on medium-low heat. Start the toast.",
        "Pour in the eggs. Stir slowly with a spatula for 2 to 3 minutes.",
        "Take the pan off the heat while the eggs still look a little wet. They finish on the plate.",
        "Eat with the toast and the banana."
      ],
      tip: "Low heat is the whole trick. High heat makes eggs dry and rubbery."
    },
    {
      id: "yogurt-bowl", name: "Greek yogurt bowl", type: "breakfast", noCook: true, mins: 3, cal: 310, protein: 26,
      blurb: "No cooking. Good before class.",
      ingredients: [["1 cup", "yogurt"], ["1/2 cup", "berries"], ["1/4 cup", "granola"], ["1 teaspoon", "honey"]],
      steps: [
        "Scoop the yogurt into a bowl.",
        "Add the berries. Frozen ones thaw in a few minutes, or microwave them for 30 seconds.",
        "Top with granola and a little honey."
      ],
      tip: "Buy the big tub of plain yogurt. Flavored cups cost more and carry a lot of added sugar."
    },
    {
      id: "overnight-oats", name: "Overnight oats", type: "breakfast", noCook: true, mins: 5, cal: 420, protein: 25,
      blurb: "Make it at night. Grab it from the fridge in the morning.",
      ingredients: [["1/2 cup", "oats"], ["1/2 cup", "milk"], ["1/2 cup", "yogurt"], ["1 tablespoon", "pb"], ["1/2", "bananas"]],
      steps: [
        "Put the oats, milk, yogurt, and peanut butter in a jar or container. Stir well.",
        "Close it and leave it in the fridge overnight.",
        "In the morning, slice the banana on top and eat it cold."
      ],
      tip: "Make two or three jars at once. They keep for about 3 days."
    },
    {
      id: "chicken-rice", name: "Chicken, rice, and broccoli", type: "main", mins: 25, cal: 500, protein: 46,
      blurb: "The classic gym meal. Easy to cook four at a time.",
      ingredients: [["6 oz", "chicken"], ["1/2 cup dry", "rice"], ["1 cup", "broccoli"], ["1 teaspoon", "oil"]],
      steps: [
        "Start the rice first, following the bag. It takes about 18 minutes.",
        "Cut the chicken into bite-size pieces. Season with salt, pepper, and any seasoning you like.",
        "Heat the oil in a pan on medium-high. Cook the chicken 6 to 8 minutes, turning it, until there is no pink inside (165°F).",
        "Microwave the broccoli in a covered bowl with a splash of water for 3 to 4 minutes.",
        "Put it all in a bowl. Soy sauce or hot sauce on top is good."
      ],
      tip: "Meal prep: cook 4 servings and box them. They keep 3 to 4 days in the fridge."
    },
    {
      id: "taco-bowl", name: "Turkey taco bowl", type: "main", mins: 20, cal: 510, protein: 35,
      blurb: "Tastes like takeout, costs a lot less.",
      ingredients: [["4 oz", "turkey"], ["1/3 cup dry", "rice"], ["1/2 cup", "beans"], ["2 tablespoons", "cheese"], ["2 tablespoons", "salsa"], ["2 teaspoons", "taco"], ["1 handful", "salad"]],
      steps: [
        "Start the rice, following the bag.",
        "Brown the turkey in a pan on medium-high, breaking it up, 6 to 8 minutes until no pink is left.",
        "Stir in the taco seasoning and a splash of water. Cook 1 more minute.",
        "Rinse the beans and warm them in the microwave for 1 minute.",
        "Build the bowl: rice, beans, turkey, lettuce, cheese, salsa."
      ],
      tip: "A 1 lb pack of turkey makes 4 bowls. Cook it all and save the rest."
    },
    {
      id: "sheet-pan", name: "Sheet pan chicken and potatoes", type: "main", mins: 35, cal: 550, protein: 36,
      blurb: "One pan in the oven. Almost no cleanup.",
      ingredients: [["2", "thighs"], ["1 medium", "potatoes"], ["1 cup", "carrots"], ["2 teaspoons", "oil"]],
      steps: [
        "Heat the oven to 425°F. Line a baking sheet with foil.",
        "Cut the potato into 1 inch chunks. Toss the potato and carrots with the oil, salt, and pepper on the sheet.",
        "Season the chicken and set it on the sheet too.",
        "Bake 25 to 30 minutes, until the chicken reaches 165°F and the potatoes are soft."
      ],
      tip: "Thighs are cheaper than breasts and much harder to dry out."
    },
    {
      id: "pasta-meat", name: "Pasta with meat sauce", type: "main", mins: 20, cal: 470, protein: 34,
      blurb: "Jar sauce plus lean beef. Comfort food that still fits.",
      ingredients: [["2 oz dry", "pasta"], ["4 oz", "beef"], ["1/2 cup", "marinara"]],
      steps: [
        "Boil a pot of salted water. Cook the pasta for the time on the box, then drain it.",
        "While it boils, brown the beef in a pan on medium-high until no pink is left, 6 to 8 minutes.",
        "Pour the marinara over the beef and simmer 3 minutes.",
        "Mix the pasta into the sauce."
      ],
      tip: "2 oz of dry pasta is a small handful. It is easy to cook double without noticing."
    },
    {
      id: "fried-rice", name: "Egg fried rice", type: "main", mins: 15, cal: 515, protein: 20,
      blurb: "The best use for leftover rice.",
      ingredients: [["1 cup cooked", "rice"], ["2", "eggs"], ["1 cup", "mixedveg"], ["1 tablespoon", "soy"], ["2 teaspoons", "oil"]],
      steps: [
        "Heat the oil in a pan on medium-high. Cook the frozen vegetables 3 minutes.",
        "Push them to the side. Crack in the eggs and scramble them.",
        "Add the rice and soy sauce. Stir everything for 3 to 4 minutes until hot."
      ],
      tip: "Cold rice from the fridge fries better than fresh. Add leftover chicken for more protein."
    },
    {
      id: "tuna-melt", name: "Tuna melt", type: "main", mins: 10, cal: 400, protein: 35,
      blurb: "Cheap, fast, and high in protein.",
      ingredients: [["1 can", "tuna"], ["1 tablespoon", "mayo"], ["2 slices", "bread"], ["2 tablespoons", "cheese"]],
      steps: [
        "Drain the tuna. Mix it with the mayo, salt, and pepper.",
        "Toast the bread.",
        "Pile the tuna on the toast and top with cheese.",
        "Microwave 30 seconds, or broil for 2 minutes, until the cheese melts."
      ],
      tip: "Skip the melting and it is a tuna sandwich you can pack for campus."
    },
    {
      id: "quesadilla", name: "Chicken quesadilla", type: "main", mins: 10, cal: 580, protein: 40,
      blurb: "Uses leftover or rotisserie chicken.",
      ingredients: [["1 large", "tortillas"], ["3 oz cooked", "rotisserie"], ["1/3 cup", "cheese"], ["2 tablespoons", "salsa"]],
      steps: [
        "Put the tortilla in a dry pan on medium heat.",
        "Cover one half with cheese and shredded chicken. Fold the other half over.",
        "Cook 2 to 3 minutes per side until it is golden and the cheese melts.",
        "Cut it up and dip it in salsa."
      ],
      tip: "Any cooked chicken works, including leftovers from the chicken and rice."
    },
    {
      id: "rotisserie-plate", name: "Rotisserie chicken plate", type: "main", noCook: true, mins: 5, cal: 550, protein: 42,
      blurb: "For nights you do not want to cook at all.",
      ingredients: [["5 oz", "rotisserie"], ["1/2 pouch", "ricepouch"], ["2 cups", "salad"], ["1 tablespoon", "dressing"]],
      steps: [
        "Pull about a cup of chicken off the bone.",
        "Microwave the rice pouch for 90 seconds.",
        "Toss the salad with the dressing and plate everything."
      ],
      tip: "One rotisserie chicken covers 3 or 4 meals. Pull the rest off the bone and refrigerate it within 2 hours."
    },
    {
      id: "apple-pb", name: "Apple and peanut butter", type: "snack", noCook: true, mins: 2, cal: 285, protein: 8,
      blurb: "Beats the vending machine.",
      ingredients: [["1", "apples"], ["2 tablespoons", "pb"]],
      steps: ["Slice the apple.", "Dip the slices in the peanut butter."],
      tip: "Measure the peanut butter once so you know what 2 tablespoons looks like. It adds up fast."
    },
    {
      id: "cottage-fruit", name: "Cottage cheese and fruit", type: "snack", noCook: true, mins: 2, cal: 220, protein: 25,
      blurb: "A lot of protein for very few calories.",
      ingredients: [["1 cup", "cottage"], ["1/2 cup", "berries"]],
      steps: ["Scoop the cottage cheese into a bowl.", "Top with berries."],
      tip: "Good late at night when you want something but dinner was hours ago."
    }
  ];

  const MEAL_FILTERS = [
    ["all", "All"],
    ["breakfast", "Breakfast"],
    ["main", "Lunch & dinner"],
    ["snack", "Snacks"],
    ["nocook", "No cooking"]
  ];

  let mealFilter = "all";
  let storeFilter = "all";
  let confirmClear = false;
  let store = loadStore();

  function loadStore() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        items: items.filter((item) => item && item.name).map((item) => ({
          id: String(item.id || newId()),
          name: String(item.name).slice(0, 60),
          sec: SECTIONS.includes(item.sec) ? item.sec : "Other",
          store: STORES.includes(item.store) ? item.store : "",
          done: Boolean(item.done)
        }))
      };
    } catch {
      return { items: [] };
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      return true;
    } catch {
      toast("Could not save on this phone. Allow site storage and try again.");
      return false;
    }
  }

  function newId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function sub() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (parts[2] === "meals") {
      const recipe = RECIPES.find((item) => item.id === parts[3]);
      return recipe ? { name: "recipe", recipe } : { name: "meals" };
    }
    if (parts[2] === "groceries") return { name: "groceries" };
    return { name: "today" };
  }

  function refresh(message) {
    render({ keepDraft: true });
    if (message) toast(message);
  }

  function has(name) {
    const key = name.trim().toLowerCase();
    return store.items.some((item) => item.name.toLowerCase() === key);
  }

  function addKeys(keys) {
    let added = 0;
    keys.forEach((key) => {
      const [name, sec, where] = CATALOG[key];
      if (has(name)) return;
      store.items.push({ id: newId(), name, sec, store: where, done: false });
      added += 1;
    });
    return added;
  }

  function tabs(current) {
    const tab = (href, label, on) => `<a href="${href}"${on ? ' aria-current="page"' : ""}>${label}</a>`;
    const left = store.items.filter((item) => !item.done).length;
    return `<nav class="nut-tabs" aria-label="Nutrition sections">
      ${tab("#/area/nutrition", "Today", current === "today")}
      ${tab("#/area/nutrition/meals", "Meals", current === "meals" || current === "recipe")}
      ${tab("#/area/nutrition/groceries", `Groceries${left ? ` <b>${left}</b>` : ""}`, current === "groceries")}
    </nav>`;
  }

  function matches(recipe) {
    if (mealFilter === "all") return true;
    if (mealFilter === "nocook") return Boolean(recipe.noCook);
    return recipe.type === mealFilter;
  }

  function mealsView() {
    const chips = MEAL_FILTERS.map(([value, label]) => `<button class="chip" type="button" data-nut="meal-filter" data-value="${value}" aria-pressed="${mealFilter === value}">${label}</button>`).join("");
    const cards = RECIPES.filter(matches).map((recipe) => `<a class="nut-meal" href="#/area/nutrition/meals/${recipe.id}">
        <span class="nut-meal-name">${esc(recipe.name)}</span>
        <span class="nut-meal-facts">${recipe.mins} min · ${recipe.cal} cal · ${recipe.protein} g protein</span>
        <span class="fine">${esc(recipe.blurb)}</span>
      </a>`).join("");
    return `<div class="nut-sub">
      <h2 class="nut-title">Simple meals</h2>
      <p class="fine">Each one makes a single serving with few ingredients. Tap a meal for the steps.</p>
      <div class="chips nut-chips">${chips}</div>
      <div class="nut-meals">${cards}</div>
      <p class="fine nut-foot">Calories and protein are estimates. Brands and portions change them.</p>
    </div>`;
  }

  function recipeView(recipe) {
    const rows = recipe.ingredients.map(([amount, key]) => `<li><span>${esc(CATALOG[key][0])}</span><span class="muted">${esc(amount)}</span></li>`).join("");
    const steps = recipe.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const missing = recipe.ingredients.filter(([, key]) => !has(CATALOG[key][0])).length;
    return `<div class="nut-sub">
      <a class="nut-back" href="#/area/nutrition/meals">${ICONS.back}<span>All meals</span></a>
      <h2 class="nut-title">${esc(recipe.name)}</h2>
      <p class="fine">${esc(recipe.blurb)}</p>
      <div class="nut-facts">
        <div><span class="fine">Time</span><strong>${recipe.mins} min</strong></div>
        <div><span class="fine">Calories</span><strong>${recipe.cal}</strong></div>
        <div><span class="fine">Protein</span><strong>${recipe.protein} g</strong></div>
      </div>
      <p class="section-label">Ingredients</p>
      <ul class="nut-ingredients">${rows}</ul>
      <button class="btn secondary full" type="button" data-nut="add-recipe" data-id="${recipe.id}"${missing ? "" : " disabled"}>${missing ? "Add ingredients to grocery list" : "All on your grocery list"}</button>
      <p class="section-label">Steps</p>
      <ol class="nut-steps">${steps}</ol>
      <p class="nut-tip">${esc(recipe.tip)}</p>
      <button class="btn full" type="button" data-nut="log-recipe" data-id="${recipe.id}">I ate this. Log it</button>
      <p class="fine nut-foot">Salt, pepper, and seasonings are not on the ingredient list. Numbers are estimates for one serving.</p>
    </div>`;
  }

  function groceriesView() {
    const count = (where) => store.items.filter((item) => !item.done && (where === "all" || item.store === where)).length;
    const chips = [["all", "All"], ["Walmart", "Walmart"], ["Publix", "Publix"]].map(([value, label]) => `<button class="chip" type="button" data-nut="store-filter" data-value="${value}" aria-pressed="${storeFilter === value}">${label} · ${count(value)}</button>`).join("");
    const shown = store.items.filter((item) => storeFilter === "all" || item.store === storeFilter);
    const groups = SECTIONS.map((sec) => {
      const list = shown.filter((item) => item.sec === sec).sort((a, b) => Number(a.done) - Number(b.done));
      if (!list.length) return "";
      const rows = list.map((item) => `<div class="nut-item${item.done ? " done" : ""}">
          <button class="nut-check" type="button" data-nut="toggle" data-id="${esc(item.id)}" aria-pressed="${item.done}">
            <span class="nut-box">${item.done ? ICONS.check : ""}</span>
            <span class="nut-name">${esc(item.name)}</span>
          </button>
          <button class="nut-store" type="button" data-nut="cycle-store" data-id="${esc(item.id)}" data-store="${esc(item.store)}" aria-label="Store for ${esc(item.name)}: ${esc(item.store || "either")}. Tap to change.">${esc(item.store || "Either")}</button>
        </div>`).join("");
      return `<p class="section-label">${esc(sec)}</p><div class="nut-list">${rows}</div>`;
    }).join("");
    const doneCount = store.items.filter((item) => item.done).length;
    let body;
    if (!store.items.length) {
      body = `<section class="panel nut-empty">
        <h2>Your list is empty</h2>
        <p class="fine">Start with a first shop that covers most of the meals here for about a week, or open a meal and add its ingredients.</p>
        <button class="btn full" type="button" data-nut="starter">Add the first stock-up list</button>
        <a class="btn secondary full" href="#/area/nutrition/meals">Browse meals</a>
      </section>`;
    } else if (!shown.length) {
      body = `<p class="fine nut-foot">Nothing set for ${esc(storeFilter)} yet. Tap the store name on any item to move it.</p>`;
    } else {
      body = `${groups}
        <div class="nut-actions">
          <button class="btn secondary" type="button" data-nut="share-list">Send list</button>
          ${doneCount ? `<button class="btn ghost" type="button" data-nut="clear-done">Remove ${doneCount} checked</button>` : ""}
          ${confirmClear
            ? `<button class="btn danger" type="button" data-nut="confirm-clear-list">Yes, clear the list</button><button class="btn ghost" type="button" data-nut="cancel-clear-list">Keep</button>`
            : `<button class="btn ghost" type="button" data-nut="ask-clear-list">Clear all</button>`}
        </div>`;
    }
    return `<div class="nut-sub">
      <h2 class="nut-title">Grocery list</h2>
      <p class="fine">Tick things off as they go in the cart. Tap a store name to switch it.</p>
      <div class="chips nut-chips">${chips}</div>
      <form id="nut-add" class="nut-add" autocomplete="off">
        <input name="item" maxlength="60" placeholder="Add an item" aria-label="Add an item" enterkeyhint="done">
        <button class="btn" type="submit">Add</button>
      </form>
      ${body}
      <section class="nut-tips">
        <p class="section-label">Shopping tips</p>
        <ul>
          <li>Walmart is usually the cheaper stop for staples like rice, oats, eggs, and frozen vegetables. Store brands are fine.</li>
          <li>At Publix, look at the weekly buy one get one deals first, and pick up a rotisserie chicken for easy meals.</li>
          <li>Eat before you shop and stick to the list.</li>
          <li>Raw chicken and ground meat keep 1 to 2 days in the fridge. Freeze what you will not cook by then.</li>
        </ul>
      </section>
    </div>`;
  }

  function listText() {
    const left = store.items.filter((item) => !item.done);
    const block = (title, list) => list.length ? `${title}\n${list.map((item) => `- ${item.name}`).join("\n")}` : "";
    return ["Grocery list",
      block("Walmart", left.filter((item) => item.store === "Walmart")),
      block("Publix", left.filter((item) => item.store === "Publix")),
      block("Either store", left.filter((item) => !item.store))
    ].filter(Boolean).join("\n\n");
  }

  async function shareList() {
    const text = listText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery list", text });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("List copied. Paste it in a text.");
    } catch {
      toast("Could not share from this browser.");
    }
  }

  function logRecipe(recipe) {
    ui.editingId = "";
    ui.photoDraft = "";
    ui.draft = { date: todayIso(), meal: recipe.name, calories: String(recipe.cal), protein: String(recipe.protein), note: "" };
    ui.draftArea = "nutrition";
    ui.logOpen = true;
    render({ keepDraft: true, capture: false });
  }

  document.addEventListener("click", (event) => {
    // "Clear this phone" in app.js should take the grocery list with it.
    if (event.target.closest('[data-action="confirm-clear"]')) {
      try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
      store = { items: [] };
      return;
    }
    const button = event.target.closest("[data-nut]");
    if (!button) return;
    const action = button.dataset.nut;
    const item = store.items.find((entry) => entry.id === button.dataset.id);
    const recipe = RECIPES.find((entry) => entry.id === button.dataset.id);
    if (action !== "ask-clear-list") confirmClear = false;

    if (action === "meal-filter") {
      mealFilter = button.dataset.value;
      refresh();
    }
    if (action === "store-filter") {
      storeFilter = button.dataset.value;
      refresh();
    }
    if (action === "toggle" && item) {
      item.done = !item.done;
      if (saveStore()) refresh();
    }
    if (action === "cycle-store" && item) {
      item.store = item.store === "Walmart" ? "Publix" : item.store === "Publix" ? "" : "Walmart";
      if (saveStore()) refresh();
    }
    if (action === "starter") {
      addKeys(STARTER);
      if (saveStore()) refresh("First stock-up list added.");
    }
    if (action === "add-recipe" && recipe) {
      const added = addKeys(recipe.ingredients.map(([, key]) => key));
      if (saveStore()) refresh(`Added ${added} ${added === 1 ? "item" : "items"} to your grocery list.`);
    }
    if (action === "log-recipe" && recipe) logRecipe(recipe);
    if (action === "clear-done") {
      store.items = store.items.filter((entry) => !entry.done);
      if (saveStore()) refresh();
    }
    if (action === "ask-clear-list") {
      confirmClear = true;
      refresh();
    }
    if (action === "cancel-clear-list") refresh();
    if (action === "confirm-clear-list") {
      store.items = [];
      if (saveStore()) refresh();
    }
    if (action === "share-list") shareList();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "nut-add") return;
    event.preventDefault();
    const name = String(new FormData(event.target).get("item") || "").trim().replace(/\s+/g, " ").slice(0, 60);
    if (!name) return;
    if (has(name)) {
      refresh("That is already on your list.");
      return;
    }
    const known = Object.values(CATALOG).find(([label]) => label.toLowerCase() === name.toLowerCase());
    store.items.push({
      id: newId(),
      name,
      sec: known ? known[1] : "Other",
      store: storeFilter !== "all" ? storeFilter : known ? known[2] : "",
      done: false
    });
    if (saveStore()) {
      refresh();
      document.querySelector("#nut-add input")?.focus();
    }
  });

  window.Nutrition = {
    // Called by renderArea() in app.js with the standard area page markup.
    page(area, basePage) {
      const view = sub();
      const body = view.name === "meals" ? mealsView()
        : view.name === "recipe" ? recipeView(view.recipe)
        : view.name === "groceries" ? groceriesView()
        : basePage;
      return `<div class="nut" style="--area:${area.color}">${tabs(view.name)}${body}</div>`;
    }
  };
})();
