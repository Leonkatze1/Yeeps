function parseFilename(filename) {
  const base = filename.replace(/\.png$/i, "");
  const idx = base.lastIndexOf("-");
  if (idx === -1) {
    return { name: base.replace(/_/g, " "), cost: null };
  }
  const namePart = base.slice(0, idx);
  const costPart = base.slice(idx + 1);
  const costNum = parseFloat(costPart.replace(/[^0-9.]/g, ""));
  return { name: namePart.replace(/_/g, " "), cost: isNaN(costNum) ? null : costNum };
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initGallery(categoryKey) {
  const category = CATEGORIES[categoryKey];
  const els = {
    status: document.getElementById("status"),
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    search: document.getElementById("search"),
    sort: document.getElementById("sort"),
    count: document.getElementById("count"),
    title: document.getElementById("pageTitle"),
    sub: document.getElementById("pageSub"),
  };

  if (!category) {
    els.status.innerHTML = `<div class="error">Unknown gallery category: "${escapeHtml(categoryKey)}"</div>`;
    return;
  }

  els.title.textContent = category.title;
  els.sub.textContent = `${REPO.owner}/${REPO.repo} — /${category.path}`;
  document.title = category.title;

  let items = [];
  const apiUrl = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${category.path}?ref=${REPO.branch}`;

  async function load() {
    try {
      const res = await fetch(apiUrl, { headers: { Accept: "application/vnd.github.v3+json" } });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GitHub API returned ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Configured path is not a directory, or repo/path is wrong.");
      }

      items = data
        .filter((f) => f.type === "file" && /\.png$/i.test(f.name))
        .map((f) => {
          const parsed = parseFilename(f.name);
          return { filename: f.name, url: f.download_url, name: parsed.name, cost: parsed.cost };
        });

      els.status.style.display = "none";
      render();
    } catch (err) {
      els.status.innerHTML = `<div class="error">Failed to load "${escapeHtml(category.title)}" from GitHub.\n\n${err.message}\n\nCheck config.js — repo/branch/path for this category.</div>`;
    }
  }

  function render() {
    const query = els.search.value.trim().toLowerCase();
    const sortMode = els.sort.value;

    let filtered = items.filter((it) => it.name.toLowerCase().includes(query));

    filtered.sort((a, b) => {
      switch (sortMode) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "cost-asc": return (a.cost ?? Infinity) - (b.cost ?? Infinity);
        case "cost-desc": return (b.cost ?? -Infinity) - (a.cost ?? -Infinity);
        default: return 0;
      }
    });

    els.count.textContent = `${filtered.length} / ${items.length} item${items.length === 1 ? "" : "s"}`;
    els.grid.innerHTML = "";
    els.empty.style.display = filtered.length === 0 ? "block" : "none";

    const frag = document.createDocumentFragment();
    for (const it of filtered) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb"><img src="${it.url}" alt="${escapeHtml(it.name)}" loading="lazy"></div>
        <div class="info">
          <div class="name">${escapeHtml(capitalize(it.name))}</div>
          <div class="cost">${it.cost !== null ? "$" + it.cost : "—"}</div>
        </div>
      `;
      frag.appendChild(card);
    }
    els.grid.appendChild(frag);
  }

  els.search.addEventListener("input", render);
  els.sort.addEventListener("change", render);

  load();
}
