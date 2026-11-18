// Nutrition extras in three categories:
//   Order    - the grocery list, with estimated Walmart prices and a running total
//   Cook     - meal cards to swipe through, with the recipe, cost, and steps beneath
//   Research - a quick check for nutrients the diet is short on, and foods that fix it
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
    berries: ["Frozen berries", "Frozen", "Walmart"],
    salmon: ["Salmon fillets (frozen)", "Frozen", "Walmart"],
    spinach: ["Spinach", "Produce", "Publix"],
    almonds: ["Almonds", "Pantry", "Walmart"],
    walnuts: ["Walnuts", "Pantry", "Walmart"],
    chia: ["Chia seeds", "Pantry", "Walmart"]
  };

  // Rough Walmart shelf prices in dollars and the pack they are for. These are estimates:
  // prices differ by store and week, so every price on the list can be edited.
  const PRICES = {
    eggs: [3, "dozen"], butter: [4, "1 lb"], yogurt: [3.75, "32 oz tub"], milk: [3.25, "gallon"],
    cheese: [2.25, "8 oz bag"], cottage: [3, "24 oz tub"], chicken: [8, "about 3 lb"], thighs: [7.5, "about 2.5 lb"],
    turkey: [5, "1 lb"], beef: [7, "1 lb"], rotisserie: [6, "whole"], bananas: [1.5, "bunch"],
    apples: [4, "3 lb bag"], salad: [2.5, "bag"], potatoes: [3.5, "5 lb bag"], carrots: [1.5, "1 lb bag"],
    bread: [2, "loaf"], tortillas: [2.5, "8 count"], rice: [3.5, "5 lb bag"], ricepouch: [2, "pouch"],
    oats: [4, "42 oz"], pasta: [1, "1 lb box"], marinara: [1.75, "24 oz jar"], beans: [1, "can"],
    tuna: [1, "can"], pb: [2, "16 oz jar"], granola: [3.5, "box"], honey: [4, "12 oz"],
    oil: [6.5, "17 oz bottle"], salsa: [2.25, "16 oz jar"], taco: [0.5, "packet"], soy: [1.75, "15 oz bottle"],
    mayo: [3.5, "30 oz jar"], dressing: [2.25, "bottle"], broccoli: [1.25, "12 oz bag"], mixedveg: [1.25, "12 oz bag"],
    berries: [3.5, "16 oz bag"], salmon: [7, "1 lb"], spinach: [2.25, "10 oz bag"], almonds: [6.5, "14 oz"],
    walnuts: [4.5, "8 oz"], chia: [4, "12 oz"]
  };

  // A first shop that covers most of the meals below for about a week.
  const STARTER = [
    "eggs", "yogurt", "milk", "cheese", "chicken", "turkey", "rotisserie",
    "bananas", "apples", "salad", "bread", "tortillas", "rice", "oats", "pasta",
    "marinara", "beans", "tuna", "pb", "oil", "salsa", "broccoli", "mixedveg", "berries"
  ];

  // Calories, protein, and cost are estimates for one serving, rounded. Brands and prices vary.
  const RECIPES = [
    {
      id: "eggs-toast", icon: "🍳", cost: 1.25, name: "Scrambled eggs and toast", type: "breakfast", mins: 10, cal: 500, protein: 27,
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
      id: "yogurt-bowl", icon: "🥣", cost: 2, name: "Greek yogurt bowl", type: "breakfast", noCook: true, mins: 3, cal: 310, protein: 26,
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
      id: "overnight-oats", icon: "🌙", cost: 1, name: "Overnight oats", type: "breakfast", noCook: true, mins: 5, cal: 420, protein: 25,
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
      id: "chicken-rice", icon: "🍗", cost: 1.75, name: "Chicken, rice, and broccoli", type: "main", mins: 25, cal: 500, protein: 46,
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
      id: "taco-bowl", icon: "🌮", cost: 2.5, name: "Turkey taco bowl", type: "main", mins: 20, cal: 510, protein: 35,
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
      id: "sheet-pan", icon: "🥔", cost: 2, name: "Sheet pan chicken and potatoes", type: "main", mins: 35, cal: 550, protein: 36,
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
      id: "pasta-meat", icon: "🍝", cost: 2.25, name: "Pasta with meat sauce", type: "main", mins: 20, cal: 470, protein: 34,
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
      id: "fried-rice", icon: "🍚", cost: 1.25, name: "Egg fried rice", type: "main", mins: 15, cal: 515, protein: 20,
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
      id: "tuna-melt", icon: "🐟", cost: 1.5, name: "Tuna melt", type: "main", mins: 10, cal: 400, protein: 35,
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
      id: "quesadilla", icon: "🫓", cost: 2, name: "Chicken quesadilla", type: "main", mins: 10, cal: 580, protein: 40,
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
      id: "rotisserie-plate", icon: "🥗", cost: 3.25, name: "Rotisserie chicken plate", type: "main", noCook: true, mins: 5, cal: 550, protein: 42,
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
      id: "apple-pb", icon: "🍎", cost: 0.75, name: "Apple and peanut butter", type: "snack", noCook: true, mins: 2, cal: 285, protein: 8,
      blurb: "Beats the vending machine.",
      ingredients: [["1", "apples"], ["2 tablespoons", "pb"]],
      steps: ["Slice the apple.", "Dip the slices in the peanut butter."],
      tip: "Measure the peanut butter once so you know what 2 tablespoons looks like. It adds up fast."
    },
    {
      id: "cottage-fruit", icon: "🍓", cost: 1.5, name: "Cottage cheese and fruit", type: "snack", noCook: true, mins: 2, cal: 220, protein: 25,
      blurb: "A lot of protein for very few calories.",
      ingredients: [["1 cup", "cottage"], ["1/2 cup", "berries"]],
      steps: ["Scoop the cottage cheese into a bowl.", "Top with berries."],
      tip: "Good late at night when you want something but dinner was hours ago."
    }
  ];

  // Daily targets are for a man aged 19 to 30 (US Dietary Guidelines and NIH fact sheets).
  // Food amounts are rounded. The protein range is a common one for someone lifting, not an official target.
  const NUTRIENTS = [
    {
      id: "protein", name: "Protein", target: "About 150 to 180 g a day while lifting",
      why: "Builds and keeps muscle, and keeps you full while losing fat.",
      foods: [["chicken", "6 oz, about 38 g"], ["yogurt", "1 cup, about 23 g"], ["tuna", "1 can, about 22 g"], ["cottage", "1 cup, about 25 g"], ["eggs", "3 eggs, about 18 g"]]
    },
    {
      id: "fiber", name: "Fiber", target: "About 34 g a day",
      why: "Keeps you full, helps digestion, and is good for cholesterol. Most people get about half of what they need.",
      foods: [["beans", "1/2 cup, about 7 g"], ["berries", "1 cup, about 5 g"], ["broccoli", "1 cup, about 5 g"], ["apples", "1 apple, about 4 g"], ["oats", "1/2 cup dry, about 4 g"], ["chia", "1 tablespoon, about 4 g"]]
    },
    {
      id: "potassium", name: "Potassium", target: "About 3,400 mg a day",
      why: "Helps muscles work and supports healthy blood pressure.",
      foods: [["potatoes", "1 medium with skin, about 900 mg"], ["bananas", "1 banana, about 420 mg"], ["milk", "1 cup, about 370 mg"], ["beans", "1/2 cup, about 300 mg"], ["spinach", "2 cups raw, about 330 mg"]]
    },
    {
      id: "vitd", name: "Vitamin D", target: "600 IU (15 mcg) a day",
      why: "Needed for bones, muscle, and immune function. It is hard to get from food alone. A blood test is the only way to know your level.",
      foods: [["salmon", "3 oz, about 450 IU"], ["milk", "1 cup fortified, about 120 IU"], ["eggs", "1 egg, about 40 IU"]]
    },
    {
      id: "calcium", name: "Calcium", target: "1,000 mg a day",
      why: "Keeps bones strong and helps muscles contract.",
      foods: [["milk", "1 cup, about 300 mg"], ["yogurt", "1 cup, about 250 mg"], ["cheese", "1/4 cup, about 200 mg"], ["cottage", "1 cup, about 140 mg"]]
    },
    {
      id: "magnesium", name: "Magnesium", target: "400 mg a day",
      why: "Used for muscle and nerve function, sleep, and turning food into energy.",
      foods: [["almonds", "1 handful (1 oz), about 80 mg"], ["spinach", "1/2 cup cooked, about 80 mg"], ["beans", "1/2 cup, about 60 mg"], ["pb", "2 tablespoons, about 50 mg"], ["bread", "2 slices, about 45 mg"]]
    },
    {
      id: "omega3", name: "Omega-3 fats", target: "Fish about twice a week",
      why: "Good for the heart and may help with soreness after training.",
      foods: [["salmon", "the best common source"], ["tuna", "a smaller amount"], ["walnuts", "1 handful, plant omega-3"], ["chia", "1 tablespoon, plant omega-3"]]
    }
  ];

  // Each question points at the nutrients it says something about.
  const QUESTIONS = [
    ["plants", "Fruit or vegetables with most meals?", ["fiber", "potassium"]],
    ["grains", "Beans, oats, or whole grain bread most days?", ["fiber", "magnesium"]],
    ["dairy", "Milk, yogurt, or cheese every day?", ["calcium", "vitd"]],
    ["fish", "Fish like salmon or tuna twice a week?", ["omega3", "vitd"]],
    ["protein", "A protein food (meat, eggs, yogurt) at every meal?", ["protein"]],
    ["nuts", "Nuts or seeds a few times a week?", ["magnesium", "omega3"]],
    ["sun", "Outside in the sun for 15 minutes most days?", ["vitd"]]
  ];
  const ANSWERS = ["Yes", "Sometimes", "Rarely"];

  const TYPE_LABEL = { breakfast: "Breakfast", main: "Lunch or dinner", snack: "Snack" };

  let selectedMeal = RECIPES[0].id;
  let editingItem = "";
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
          done: Boolean(item.done),
          price: cleanPrice(item.price),
          size: String(item.size || "").slice(0, 24)
        })),
        answers: data.answers && typeof data.answers === "object" ? data.answers : {}
      };
    } catch {
      return emptyStore();
    }
  }

  function emptyStore() {
    return { items: [], answers: {} };
  }

  // A price is a number of dollars, or null when it is not known yet.
  function cleanPrice(value) {
    if (value === "" || value == null) return null;
    const number = Math.round(Number(value) * 100) / 100;
    return Number.isFinite(number) && number >= 0 && number < 1000 ? number : null;
  }

  function money(value) {
    return `$${Number(value).toFixed(2)}`;
  }

  function sum(list) {
    return list.reduce((total, item) => total + (item.price || 0), 0);
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
    if (parts[2] === "cook") return { name: "cook", tab: "cook" };
    if (parts[2] === "order") return { name: "order", tab: "order" };
    if (parts[2] === "research") return { name: "research", tab: "research" };
    return { name: "today", tab: "" };
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
      store.items.push({ id: newId(), name, sec, store: where, done: false, price: PRICES[key][0], size: PRICES[key][1] });
      added += 1;
    });
    return added;
  }

  const CATEGORIES = [
    ["order", "Order", "Your Walmart list, with prices and a total."],
    ["cook", "Cook", "Meals with the recipe, cost, and steps."],
    ["research", "Research", "Find what your diet is short on."]
  ];

  function tabs(current) {
    const links = CATEGORIES.map(([id, label]) => `<a href="#/area/nutrition/${id}"${current === id ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    return `<nav class="nut-tabs" aria-label="Nutrition sections">${links}</nav>`;
  }

  // The three categories as big rows on the Nutrition home, above the food log.
  function homeCards() {
    const rows = CATEGORIES.map(([id, label, blurb]) => `<a class="nut-cat" href="#/area/nutrition/${id}">
        <span><span class="nut-cat-name">${label}</span><span class="fine">${blurb}</span></span>
        <span class="nut-cat-go" aria-hidden="true">›</span>
      </a>`).join("");
    return `<div class="nut-cats">${rows}</div><p class="section-label">Food log</p>`;
  }

  // Cook: a row of meal cards to swipe through. The picked meal's recipe sits beneath.
  // Every recipe is in the page and only the picked one is shown, so picking a card
  // does not re-render and the row keeps its place.
  function cookView() {
    const cards = RECIPES.map((recipe) => `<button class="nut-card" type="button" data-nut="pick-meal" data-id="${recipe.id}" aria-pressed="${recipe.id === selectedMeal}">
        <span class="nut-card-icon" aria-hidden="true">${recipe.icon}</span>
        <span class="nut-card-name">${esc(recipe.name)}</span>
        <span class="nut-card-facts">${recipe.mins} min · ${money(recipe.cost)}</span>
      </button>`).join("");
    const details = RECIPES.map(recipeDetail).join("");
    return `<div class="nut-sub">
      <h2 class="nut-title">Cook</h2>
      <p class="fine">Swipe through the meals and tap one. The recipe is below.</p>
      <div class="nut-rail" id="nut-rail">${cards}</div>
      ${details}
      <p class="fine nut-foot">Calories, protein, and cost are estimates for one serving. Salt, pepper, and seasonings are not on the ingredient lists.</p>
    </div>`;
  }

  function recipeDetail(recipe) {
    const rows = recipe.ingredients.map(([amount, key]) => `<li><span>${esc(CATALOG[key][0])}</span><span class="muted">${esc(amount)}</span></li>`).join("");
    const steps = recipe.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const missing = recipe.ingredients.filter(([, key]) => !has(CATALOG[key][0])).length;
    return `<article class="nut-recipe" data-recipe="${recipe.id}"${recipe.id === selectedMeal ? "" : " hidden"}>
      <p class="kicker">${TYPE_LABEL[recipe.type]}${recipe.noCook ? " · No cooking" : ""}</p>
      <h3 class="nut-recipe-name">${esc(recipe.name)}</h3>
      <p class="fine">${esc(recipe.blurb)}</p>
      <div class="nut-facts">
        <div><span class="fine">Cost</span><strong>${money(recipe.cost)}</strong></div>
        <div><span class="fine">Time</span><strong>${recipe.mins} min</strong></div>
        <div><span class="fine">Calories</span><strong>${recipe.cal}</strong></div>
        <div><span class="fine">Protein</span><strong>${recipe.protein} g</strong></div>
      </div>
      <p class="section-label">Ingredients</p>
      <ul class="nut-ingredients">${rows}</ul>
      <button class="btn secondary full" type="button" data-nut="add-recipe" data-id="${recipe.id}"${missing ? "" : " disabled"}>${missing ? "Add ingredients to my order" : "All on your order list"}</button>
      <p class="section-label">Steps</p>
      <ol class="nut-steps">${steps}</ol>
      <p class="nut-tip">${esc(recipe.tip)}</p>
      <button class="btn full" type="button" data-nut="log-recipe" data-id="${recipe.id}">I ate this. Log it</button>
    </article>`;
  }

  // Bring the picked card into view after a render replaces the row.
  function showPickedCard() {
    const rail = document.getElementById("nut-rail");
    const card = rail?.querySelector('[aria-pressed="true"]');
    if (!rail || !card) return;
    rail.scrollLeft = Math.max(0, card.offsetLeft - rail.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2);
  }

  // Order: the list of food to buy, with a price on every item and a running total.
  function orderView() {
    const inStore = (item) => storeFilter === "all" || item.store === storeFilter;
    const count = (where) => store.items.filter((item) => !item.done && (where === "all" || item.store === where)).length;
    const chips = [["all", "All"], ["Walmart", "Walmart"], ["Publix", "Publix"]].map(([value, label]) => `<button class="chip" type="button" data-nut="store-filter" data-value="${value}" aria-pressed="${storeFilter === value}">${label} · ${count(value)}</button>`).join("");
    const shown = store.items.filter(inStore);
    const left = shown.filter((item) => !item.done);
    const cart = shown.filter((item) => item.done);
    const unpriced = left.filter((item) => item.price == null).length;
    const groups = SECTIONS.map((sec) => {
      const list = shown.filter((item) => item.sec === sec).sort((a, b) => Number(a.done) - Number(b.done));
      if (!list.length) return "";
      const rows = list.map((item) => {
        const editing = editingItem === item.id;
        const detail = [item.size, item.store || "Either store"].filter(Boolean).join(" · ");
        const editor = editing ? `<form class="nut-edit" id="nut-edit" data-id="${esc(item.id)}" autocomplete="off">
            <label class="field"><span>Price you pay ($)</span><input name="price" type="number" inputmode="decimal" min="0" step="0.01" value="${item.price == null ? "" : esc(item.price)}" placeholder="0.00"></label>
            <div class="field"><span>Store</span><div class="nut-answers">${[["Walmart", "Walmart"], ["Publix", "Publix"], ["", "Either"]].map(([value, label]) => `<button class="pick" type="button" data-nut="set-store" data-id="${esc(item.id)}" data-value="${value}" aria-pressed="${item.store === value}">${label}</button>`).join("")}</div></div>
            <div class="row-actions">
              <button class="btn" type="submit">Save price</button>
              <button class="btn ghost" type="button" data-nut="remove-item" data-id="${esc(item.id)}">Remove item</button>
            </div>
          </form>` : "";
        return `<div class="nut-item${item.done ? " done" : ""}">
          <div class="nut-row">
            <button class="nut-check" type="button" data-nut="toggle" data-id="${esc(item.id)}" aria-pressed="${item.done}">
              <span class="nut-box">${item.done ? ICONS.check : ""}</span>
              <span><span class="nut-name">${esc(item.name)}</span><span class="fine">${esc(detail)}</span></span>
            </button>
            <button class="nut-price" type="button" data-nut="edit-item" data-id="${esc(item.id)}" aria-expanded="${editing}" aria-label="Edit ${esc(item.name)}">${item.price == null ? "Add price" : money(item.price)}</button>
          </div>
          ${editor}
        </div>`;
      }).join("");
      return `<p class="section-label">${esc(sec)}</p><div class="nut-list">${rows}</div>`;
    }).join("");
    let body;
    if (!store.items.length) {
      body = `<section class="panel nut-empty">
        <h2>Your list is empty</h2>
        <p class="fine">Start with a first shop that covers most of the meals in Cook for about a week, or pick a meal there and add its ingredients.</p>
        <button class="btn full" type="button" data-nut="starter">Add the first stock-up list</button>
        <a class="btn secondary full" href="#/area/nutrition/cook">Pick meals in Cook</a>
      </section>`;
    } else if (!shown.length) {
      body = `<p class="fine nut-foot">Nothing set for ${esc(storeFilter)} yet. Tap an item's price to change its store.</p>`;
    } else {
      body = `<section class="nut-total">
          <div><span class="fine">Left to buy · ${left.length} ${left.length === 1 ? "item" : "items"}</span><strong>${money(sum(left))}</strong></div>
          <div><span class="fine">In the cart</span><strong>${money(sum(cart))}</strong></div>
          <p class="fine">Estimated before tax${unpriced ? `. ${unpriced} ${unpriced === 1 ? "item has" : "items have"} no price yet` : ""}.</p>
        </section>
        ${groups}
        <div class="nut-actions">
          <button class="btn secondary" type="button" data-nut="share-list">Send list</button>
          ${cart.length ? `<button class="btn ghost" type="button" data-nut="clear-done">Remove ${cart.length} checked</button>` : ""}
          ${confirmClear
            ? `<button class="btn danger" type="button" data-nut="confirm-clear-list">Yes, clear the list</button><button class="btn ghost" type="button" data-nut="cancel-clear-list">Keep</button>`
            : `<button class="btn ghost" type="button" data-nut="ask-clear-list">Clear all</button>`}
        </div>`;
    }
    return `<div class="nut-sub">
      <h2 class="nut-title">Order</h2>
      <p class="fine">The food you buy. Tick items off in the store, and tap a price to set what you really pay.</p>
      <div class="chips nut-chips">${chips}</div>
      <form id="nut-add" class="nut-add" autocomplete="off">
        <input name="item" maxlength="60" placeholder="Add an item" aria-label="Add an item" enterkeyhint="done">
        <button class="btn" type="submit">Add</button>
      </form>
      ${body}
      <section class="nut-tips">
        <p class="section-label">About the prices</p>
        <ul>
          <li>Prices are rough Walmart estimates for store brands. They change by store and week, so fix them as you shop and the total gets accurate.</li>
          <li>Walmart is usually cheaper for staples. At Publix, check the weekly buy one get one deals first.</li>
          <li>Eat before you shop and stick to the list.</li>
          <li>Raw chicken and ground meat keep 1 to 2 days in the fridge. Freeze what you will not cook by then.</li>
        </ul>
      </section>
    </div>`;
  }

  // Score each nutrient from the quiz: Rarely counts 2, Sometimes 1, Yes 0.
  // A nutrient only appears in the result once one of its questions has an answer.
  function scores() {
    const total = {};
    QUESTIONS.forEach(([id, , nutrients]) => {
      const answer = store.answers[id];
      if (![0, 1, 2].includes(answer)) return;
      nutrients.forEach((nutrient) => { total[nutrient] = (total[nutrient] || 0) + answer; });
    });
    return total;
  }

  function researchView() {
    const answered = QUESTIONS.filter(([id]) => [0, 1, 2].includes(store.answers[id])).length;
    const quiz = QUESTIONS.map(([id, text]) => `<div class="nut-q">
        <p>${esc(text)}</p>
        <div class="nut-answers">${ANSWERS.map((label, value) => `<button class="pick" type="button" data-nut="answer" data-q="${id}" data-value="${value}" aria-pressed="${store.answers[id] === value}">${label}</button>`).join("")}</div>
      </div>`).join("");
    const total = scores();
    const ranked = NUTRIENTS.map((nutrient, index) => ({ nutrient, index, score: total[nutrient.id] || 0, asked: nutrient.id in total }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const cards = ranked.map(({ nutrient, score, asked }) => {
      const flag = score >= 2 ? `<span class="nut-flag low">Likely short</span>` : score === 1 ? `<span class="nut-flag">Could be better</span>` : asked ? `<span class="nut-flag ok">Looks covered</span>` : "";
      const foods = nutrient.foods.map(([key, amount]) => `<li><span>${esc(CATALOG[key][0])}</span><span class="muted">${esc(amount)}</span></li>`).join("");
      const missing = nutrient.foods.filter(([key]) => !has(CATALOG[key][0])).length;
      return `<details class="nut-nutrient"${score >= 2 ? " open" : ""}>
        <summary><span class="nut-meal-name">${esc(nutrient.name)}</span>${flag}</summary>
        <p class="nut-target">${esc(nutrient.target)}</p>
        <p class="fine">${esc(nutrient.why)}</p>
        <ul class="nut-ingredients">${foods}</ul>
        <button class="btn secondary full" type="button" data-nut="add-foods" data-id="${nutrient.id}"${missing ? "" : " disabled"}>${missing ? "Add these foods to my order" : "All on your order list"}</button>
      </details>`;
    }).join("");
    return `<div class="nut-sub">
      <h2 class="nut-title">Research</h2>
      <p class="fine">Answer a few questions about how you eat now. The nutrients you are most likely short on move to the top, with foods that fix them.</p>
      <p class="section-label">Quick check · ${answered} of ${QUESTIONS.length}</p>
      <div class="nut-quiz">${quiz}</div>
      <p class="section-label">${answered ? "Your nutrients, most needed first" : "Nutrients worth watching"}</p>
      <div class="nut-nutrients">${cards}</div>
      <p class="fine nut-foot">This is a rough guide from your answers, not a diagnosis. Targets are for men aged 19 to 30 and amounts are rounded. Food comes first. Ask a doctor before taking supplements, and a blood test is the way to confirm a real deficiency.</p>
    </div>`;
  }

  function listText() {
    const left = store.items.filter((item) => !item.done);
    const block = (title, list) => list.length ? `${title}\n${list.map((item) => `- ${item.name}`).join("\n")}` : "";
    return ["Order list",
      block("Walmart", left.filter((item) => item.store === "Walmart")),
      block("Publix", left.filter((item) => item.store === "Publix")),
      block("Either store", left.filter((item) => !item.store))
    ].filter(Boolean).join("\n\n");
  }

  async function shareList() {
    const text = listText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Order list", text });
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

  function logMeal(meal, calories, protein) {
    ui.editingId = "";
    ui.photoDraft = "";
    ui.draft = { date: todayIso(), meal, calories: String(calories ?? ""), protein: String(protein ?? ""), note: "" };
    ui.draftArea = "nutrition";
    ui.logOpen = true;
    render({ keepDraft: true, capture: false });
  }

  document.addEventListener("click", (event) => {
    // "Clear this phone" in app.js should take the grocery list with it.
    if (event.target.closest('[data-action="confirm-clear"]')) {
      try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
      store = emptyStore();
      return;
    }
    const button = event.target.closest("[data-nut]");
    if (!button) return;
    const action = button.dataset.nut;
    const item = store.items.find((entry) => entry.id === button.dataset.id);
    const recipe = RECIPES.find((entry) => entry.id === button.dataset.id);
    if (action !== "ask-clear-list") confirmClear = false;

    if (action === "pick-meal" && recipe) {
      selectedMeal = recipe.id;
      document.querySelectorAll(".nut-card").forEach((card) => card.setAttribute("aria-pressed", String(card.dataset.id === recipe.id)));
      document.querySelectorAll(".nut-recipe").forEach((block) => { block.hidden = block.dataset.recipe !== recipe.id; });
      button.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
    if (action === "store-filter") {
      storeFilter = button.dataset.value;
      refresh();
    }
    if (action === "toggle" && item) {
      item.done = !item.done;
      if (saveStore()) refresh();
    }
    if (action === "edit-item" && item) {
      editingItem = editingItem === item.id ? "" : item.id;
      refresh();
    }
    if (action === "set-store" && item) {
      item.store = STORES.includes(button.dataset.value) ? button.dataset.value : "";
      if (saveStore()) refresh();
    }
    if (action === "remove-item" && item) {
      store.items = store.items.filter((entry) => entry !== item);
      editingItem = "";
      if (saveStore()) refresh();
    }
    if (action === "starter") {
      addKeys(STARTER);
      if (saveStore()) refresh("First stock-up list added.");
    }
    if (action === "add-recipe" && recipe) {
      const added = addKeys(recipe.ingredients.map(([, key]) => key));
      if (saveStore()) refresh(`Added ${added} ${added === 1 ? "item" : "items"} to your order list.`);
    }
    if (action === "log-recipe" && recipe) logMeal(recipe.name, recipe.cal, recipe.protein);
    if (action === "add-foods") {
      const nutrient = NUTRIENTS.find((entry) => entry.id === button.dataset.id);
      if (nutrient) {
        const added = addKeys(nutrient.foods.map(([key]) => key));
        if (saveStore()) refresh(`Added ${added} ${added === 1 ? "item" : "items"} to your order list.`);
      }
    }
    if (action === "answer") {
      const value = Number(button.dataset.value);
      if (store.answers[button.dataset.q] === value) delete store.answers[button.dataset.q];
      else store.answers[button.dataset.q] = value;
      if (saveStore()) refresh();
    }
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
    if (event.target.id === "nut-edit") {
      event.preventDefault();
      const item = store.items.find((entry) => entry.id === event.target.dataset.id);
      if (item) item.price = cleanPrice(new FormData(event.target).get("price"));
      editingItem = "";
      if (saveStore()) refresh();
      return;
    }
    if (event.target.id !== "nut-add") return;
    event.preventDefault();
    const name = String(new FormData(event.target).get("item") || "").trim().replace(/\s+/g, " ").slice(0, 60);
    if (!name) return;
    if (has(name)) {
      refresh("That is already on your list.");
      return;
    }
    const key = Object.keys(CATALOG).find((entry) => CATALOG[entry][0].toLowerCase() === name.toLowerCase());
    const known = key ? CATALOG[key] : null;
    store.items.push({
      id: newId(),
      name,
      sec: known ? known[1] : "Other",
      store: storeFilter !== "all" ? storeFilter : known ? known[2] : "Walmart",
      done: false,
      price: key ? PRICES[key][0] : null,
      size: key ? PRICES[key][1] : ""
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
      if (view.name === "cook") queueMicrotask(showPickedCard);
      const body = view.name === "cook" ? cookView()
        : view.name === "order" ? orderView()
        : view.name === "research" ? researchView()
        : homeCards() + basePage;
      return `<div class="nut" style="--area:${area.color}">${view.tab ? tabs(view.tab) : ""}${body}</div>`;
    }
  };
})();
