/* ====================== CONFIG ======================
   One entry per gallery. "path" is the folder inside the
   repo that holds that category's PNGs.
   ====================================================== */
const REPO = {
  owner: "leonkatze1",
  repo: "Yeeps",
  branch: "main",
};

const CATEGORIES = {
  cosmetics: {
    title: "Cosmetic Gallery",
    icon: "🎨",
    desc: "Browse all cosmetics and their costs.",
    path: "cosmetics", // folder in repo
  },
  items: {
    title: "Item Gallery",
    icon: "📦",
    desc: "Browse all items and their costs.",
    path: "items", // folder in repo
  },
  entities: {
    title: "Entity Gallery",
    icon: "👾",
    desc: "Browse all entities and their costs.",
    path: "entities", // folder in repo
  },
};
