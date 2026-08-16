/* ====================== CONFIG ======================
   REPO: where everything lives.

   Each category:
     path        - folder with that category's PNGs
     soundsPath  - folder with sound files auto-matched to items by name
                   (leave null if this category has no sounds yet)
     metaPath    - optional JSON file with extra per-item data:
                   {
                     "Exact_File_Name.png": {
                       "description": "Text shown in the detail view.",
                       "stuffing": 12,          // adds/overrides a currency
                       "buttcoins": 50,         // overrides filename-parsed cost
                       "sounds": ["a.mp3","b.wav"] // overrides auto-matched sounds
                     }
                   }
                   (leave null if this category has no meta.json yet)
     currencies  - which cost fields to show, in order. The FIRST currency
                   is the one parsed from the filename by default; any
                   currency can be overridden/added per-item via meta.json.
   ====================================================== */
const REPO = {
  owner: "leonkatze1",
  repo: "Yeeps",
  branch: "main",
};

const CURRENCY = {
  buttcoins: { label: "Buttcoins", icon: "🪙" },
  stuffing: { label: "Stuffing / Cotton", icon: "🧵" },
};

const CATEGORIES = {
  cosmetics: {
    title: "Cosmetic Gallery",
    icon: "🎨",
    desc: "Browse all cosmetics and their costs.",
    path: "cosmetics",
    soundsPath: "sounds/cosmetics",
    metaPath: "cosmetics/meta.json",
    currencies: ["buttcoins"],
  },
  items: {
    title: "Item Gallery",
    icon: "📦",
    desc: "Browse all items and their costs.",
    path: "items",
    soundsPath: "sounds/items",
    metaPath: "items/meta.json",
    currencies: ["buttcoins", "stuffing"],
  },
  entities: {
    title: "Entity Gallery",
    icon: "👾",
    desc: "Browse all entities and their costs.",
    path: "entities",
    soundsPath: "sounds/entities",
    metaPath: "entities/meta.json",
    currencies: ["buttcoins"],
  },
  potions: {
    title: "Potions",
    icon: "🧪",
    desc: "Browse all potions and their costs.",
    path: "potions",
    soundsPath: "sounds/potions",
    metaPath: "potions/meta.json",
    currencies: ["buttcoins", "stuffing"],
  },
  discs: {
    title: "Discs",
    icon: "💿",
    desc: "Browse all discs and their costs.",
    path: "discs",
    soundsPath: "sounds/discs",
    metaPath: "discs/meta.json",
    currencies: ["buttcoins", "stuffing"],
  },
  food: {
    title: "Food",
    icon: "🍔",
    desc: "Browse all food items and their costs.",
    path: "food",
    soundsPath: "sounds/food",
    metaPath: "food/meta.json",
    currencies: ["buttcoins"],
  },
  paints: {
    title: "Paints",
    icon: "🖌️",
    desc: "Browse all paints and their costs.",
    path: "paints",
    soundsPath: "sounds/paints",
    metaPath: "paints/meta.json",
    currencies: ["buttcoins", "stuffing"],
  },
  pets: {
    title: "Pets",
    icon: "🐾",
    desc: "Browse all pets and their costs.",
    path: "pets",
    soundsPath: "sounds/pets",
    metaPath: "pets/meta.json",
    currencies: ["buttcoins", "stuffing"],
  },
  plushies: {
    title: "Plushies",
    icon: "🧸",
    desc: "Browse all plushies and their costs.",
    path: "plushies",
    soundsPath: "sounds/plushies",
    metaPath: "plushies/meta.json",
    currencies: ["stuffing", "buttcoins"],
  },
  roles: {
    title: "Roles",
    icon: "🏷️",
    desc: "Browse all roles and their costs.",
    path: "roles",
    soundsPath: "sounds/roles",
    metaPath: "roles/meta.json",
    currencies: [],
  },
};
