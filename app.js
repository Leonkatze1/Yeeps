/* ---------- filename parsing ---------- */

function parseFilename(filename) {
  const base = filename.replace(/\.png$/i, "");

  // Walk the string once. "\-" and "--" both count as an escaped, literal
  // dash (collapsed to a single "-" in the output). Only a lone "-" that
  // isn't part of either pattern is a separator candidate; the LAST such
  // candidate is used as the name/cost split point.
  const chars = [];
  let lastSepIdx = -1;
  let i = 0;
  while (i < base.length) {
    if (base[i] === "\\" && base[i + 1] === "-") {
      chars.push("-");
      i += 2;
    } else if (base[i] === "-" && base[i + 1] === "-") {
      chars.push("-");
      i += 2;
    } else if (base[i] === "-") {
      chars.push("-");
      lastSepIdx = chars.length - 1;
      i += 1;
    } else {
      chars.push(base[i]);
      i += 1;
    }
  }

  const clean = (s) => s.replace(/_/g, " ");

  if (lastSepIdx === -1) {
    return { name: clean(chars.join("")), cost: null };
  }
  const namePart = chars.slice(0, lastSepIdx).join("");
  const costPart = chars.slice(lastSepIdx + 1).join("");
  const costNum = parseFloat(costPart.replace(/[^0-9.]/g, ""));
  return { name: clean(namePart), cost: isNaN(costNum) ? null : costNum };
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- GitHub helpers ---------- */

async function fetchDirectory(path) {
  const url = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API returned ${res.status} ${res.statusText} for /${path}\n${body.slice(0, 300)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`"${path}" is not a directory, or the path is wrong.`);
  return data;
}

// Optional folder/file — missing (404) is treated as "nothing there", not an error.
async function fetchDirectorySafe(path) {
  if (!path) return [];
  try {
    return await fetchDirectory(path);
  } catch (err) {
    return [];
  }
}

async function fetchMetaSafe(path) {
  if (!path) return {};
  try {
    const url = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.repo}/${REPO.branch}/${path}`;
    const res = await fetch(url);
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    return {};
  }
}

/* ---------- sound matching ---------- */

function normalizeForMatch(s) {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function findMatchingSounds(itemName, soundFiles) {
  const target = normalizeForMatch(itemName);
  if (!target) return [];
  return soundFiles.filter((f) => {
    const norm = normalizeForMatch(f.name);
    return norm.startsWith(target) || norm.includes(target);
  });
}

/* ---------- gallery ---------- */

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
    modalOverlay: document.getElementById("modalOverlay"),
    modalClose: document.getElementById("modalClose"),
    modalImg: document.getElementById("modalImg"),
    modalName: document.getElementById("modalName"),
    modalCosts: document.getElementById("modalCosts"),
    modalDesc: document.getElementById("modalDesc"),
    modalSoundsBody: document.getElementById("modalSoundsBody"),
    modalSoundsTable: document.getElementById("modalSoundsTable"),
    modalSoundsEmpty: document.getElementById("modalSoundsEmpty"),
  };

  if (!category) {
    els.status.innerHTML = `<div class="error">Unknown gallery category: "${escapeHtml(categoryKey)}"</div>`;
    return;
  }

  els.title.textContent = category.title;
  els.sub.textContent = `${REPO.owner}/${REPO.repo} — /${category.path}`;
  document.title = category.title;

  let items = [];
  const currencyKeys = category.currencies && category.currencies.length ? category.currencies : ["buttcoins"];
  const primaryCurrency = currencyKeys[0];

  async function load() {
    try {
      const [files, meta, soundFiles] = await Promise.all([
        fetchDirectory(category.path),
        fetchMetaSafe(category.metaPath),
        fetchDirectorySafe(category.soundsPath),
      ]);

      items = files
        .filter((f) => f.type === "file" && /\.png$/i.test(f.name))
        .map((f) => {
          const parsed = parseFilename(f.name);
          const m = meta[f.name] || {};

          const costs = {};
          currencyKeys.forEach((key, idx) => {
            if (Object.prototype.hasOwnProperty.call(m, key)) {
              costs[key] = m[key];
            } else if (idx === 0) {
              costs[key] = parsed.cost;
            } else {
              costs[key] = null;
            }
          });

          const sounds = Array.isArray(m.sounds) && m.sounds.length
            ? m.sounds.map((name) => ({ name, matchedByName: false }))
            : findMatchingSounds(parsed.name, soundFiles).map((f2) => ({ name: f2.name, url: f2.download_url }));

          return {
            filename: f.name,
            url: f.download_url,
            name: parsed.name,
            costs,
            description: m.description || "",
            sounds,
          };
        });

      els.status.style.display = "none";
      render();
    } catch (err) {
      els.status.innerHTML = `<div class="error">Failed to load "${escapeHtml(category.title)}" from GitHub.\n\n${err.message}\n\nCheck config.js — repo/branch/path for this category.</div>`;
    }
  }

  function costLabel(key) {
    const c = CURRENCY[key];
    return c ? `${c.icon} ${c.label}` : key;
  }

  function render() {
    const query = els.search.value.trim().toLowerCase();
    const sortMode = els.sort.value;

    let filtered = items.filter((it) => it.name.toLowerCase().includes(query));

    filtered.sort((a, b) => {
      const aCost = a.costs[primaryCurrency];
      const bCost = b.costs[primaryCurrency];
      switch (sortMode) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "cost-asc": return (aCost ?? Infinity) - (bCost ?? Infinity);
        case "cost-desc": return (bCost ?? -Infinity) - (aCost ?? -Infinity);
        default: return 0;
      }
    });

    els.count.textContent = `${filtered.length} / ${items.length} item${items.length === 1 ? "" : "s"}`;
    els.grid.innerHTML = "";
    els.empty.style.display = filtered.length === 0 ? "block" : "none";

    const frag = document.createDocumentFragment();
    for (const it of filtered) {
      const primaryCost = it.costs[primaryCurrency];
      const card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="thumb"><img src="${it.url}" alt="${escapeHtml(it.name)}" loading="lazy"></div>
        <div class="info">
          <div class="name">${escapeHtml(capitalize(it.name))}</div>
          <div class="cost">${primaryCost !== null && primaryCost !== undefined ? CURRENCY[primaryCurrency].icon + " " + primaryCost : "—"}</div>
        </div>
      `;
      card.addEventListener("click", () => openModal(it));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(it); }
      });
      frag.appendChild(card);
    }
    els.grid.appendChild(frag);
  }

  function openModal(it) {
    els.modalImg.src = it.url;
    els.modalImg.alt = it.name;
    els.modalName.textContent = capitalize(it.name);

    els.modalCosts.innerHTML = currencyKeys
      .map((key) => {
        const val = it.costs[key];
        return `<div class="modal-cost-pill">${costLabel(key)}: <strong>${val !== null && val !== undefined ? val : "—"}</strong></div>`;
      })
      .join("");

    els.modalDesc.textContent = it.description || "No description yet.";

    els.modalSoundsBody.innerHTML = "";
    if (it.sounds.length === 0) {
      els.modalSoundsTable.style.display = "none";
      els.modalSoundsEmpty.style.display = "block";
    } else {
      els.modalSoundsTable.style.display = "table";
      els.modalSoundsEmpty.style.display = "none";
      for (const s of it.sounds) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.textContent = s.name;
        const playCell = document.createElement("td");
        if (s.url) {
          const audio = document.createElement("audio");
          audio.controls = true;
          audio.src = s.url;
          audio.preload = "none";
          playCell.appendChild(audio);
        } else {
          playCell.textContent = "(no file found)";
        }
        row.appendChild(nameCell);
        row.appendChild(playCell);
        els.modalSoundsBody.appendChild(row);
      }
    }

    els.modalOverlay.style.display = "flex";
  }

  function closeModal() {
    els.modalOverlay.style.display = "none";
    els.modalSoundsBody.querySelectorAll("audio").forEach((a) => a.pause());
  }

  els.modalClose.addEventListener("click", closeModal);
  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  els.search.addEventListener("input", render);
  els.sort.addEventListener("change", render);

  load();
}
