const URL_POKE_BASE = "https://pokeapi.co/api/v2/pokemon/";
const URL_TODOS = "https://jsonplaceholder.typicode.com/todos";
const URL_CAT_FACTS = "https://catfact.ninja/facts";

let activeApi = "poke";

function setMsg(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function clearWrap(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = "";
}

function clearSection(msgId, wrapId) {
  setMsg(msgId, "");
  clearWrap(wrapId);
}

function renderKeyValueTable(containerId, rows) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Campo", "Valor"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach(r => {
    const tr = document.createElement("tr");

    const tdKey = document.createElement("td");
    tdKey.textContent = r.key;

    const tdVal = document.createElement("td");
    if (r.valueNode) tdVal.appendChild(r.valueNode);
    else tdVal.textContent = String(r.value ?? "");

    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  wrap.innerHTML = "";
  wrap.appendChild(table);
}

function renderTable(containerId, headers, rows) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      if (cell instanceof Node) td.appendChild(cell);
      else td.textContent = String(cell ?? "");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  wrap.innerHTML = "";
  wrap.appendChild(table);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return res.json();
}

async function cargarYProcesar(url, msgId, tableWrapId, processorFn) {
  try {
    setMsg(msgId, "Cargando...");
    const data = await fetchJson(url);
    const rows = processorFn(data);
    renderKeyValueTable(tableWrapId, rows);
    setMsg(msgId, "Listo.");
  } catch (err) {
    setMsg(msgId, "Error: " + err.message);
    clearWrap(tableWrapId);
  }
}

function procesarPoke(data) {
  const types = (data.types || []).map(t => t.type?.name).filter(Boolean);

  const badges = document.createElement("div");
  types.forEach(t => {
    const span = document.createElement("span");
    span.className = "badge";
    span.textContent = t;
    badges.appendChild(span);
  });

  return [
    { key: "Nombre", value: data.name ?? "N/A" },
    { key: "ID", value: String(data.id ?? "N/A") },
    { key: "Altura", value: String(data.height ?? "N/A") },
    { key: "Peso", value: String(data.weight ?? "N/A") },
    { key: "Tipos", valueNode: badges }
  ];
}

function estadoNode(completed) {
  const done = !!completed;
  const state = document.createElement("span");
  state.className = done ? "ok" : "no";
  state.textContent = done ? "Completado" : "Pendiente";
  return state;
}

function procesarTodo(data) {
  return [
    { key: "User ID", value: String(data.userId ?? "N/A") },
    { key: "Todo ID", value: String(data.id ?? "N/A") },
    { key: "Título", value: data.title ?? "N/A" },
    { key: "Estado", valueNode: estadoNode(data.completed) }
  ];
}

async function buscarPokemon(query) {
  const q = (query ?? "").trim();
  if (!q) {
    setMsg("pokeMsg", "Escribe un nombre o ID (ej: pikachu, 25).");
    clearWrap("pokeTableWrap");
    return;
  }
  const url = URL_POKE_BASE + encodeURIComponent(q.toLowerCase());
  await cargarYProcesar(url, "pokeMsg", "pokeTableWrap", procesarPoke);
}

function renderTodosList(todos) {
  const headers = ["User ID", "Todo ID", "Título", "Estado"];
  const rows = (todos || []).map(t => ([
    String(t.userId ?? ""),
    String(t.id ?? ""),
    t.title ?? "N/A",
    estadoNode(t.completed)
  ]));
  renderTable("todoTableWrap", headers, rows);
}

async function buscarTodos(query) {
  const q = (query ?? "").trim();
  if (!q) {
    setMsg("todoMsg", "Escribe: id (ej: 1), userId:1, o palabra del título (ej: delectus).");
    clearWrap("todoTableWrap");
    return;
  }

  try {
    setMsg("todoMsg", "Cargando...");
    clearWrap("todoTableWrap");

    if (/^\d+$/.test(q)) {
      await cargarYProcesar(`${URL_TODOS}/${q}`, "todoMsg", "todoTableWrap", procesarTodo);
      return;
    }

    const m = q.match(/^user(id)?\s*[:=]\s*(\d+)$/i);
    if (m) {
      const userId = m[2];
      const data = await fetchJson(`${URL_TODOS}?userId=${encodeURIComponent(userId)}`);
      renderTodosList(data);
      setMsg("todoMsg", `Listo. Resultados: ${data.length}.`);
      return;
    }

    const all = await fetchJson(URL_TODOS);
    const needle = q.toLowerCase();
    const filtered = (all || []).filter(t =>
      (t.title ?? "").toLowerCase().includes(needle)
    );

    const shown = filtered.slice(0, 20);
    renderTodosList(shown);
    setMsg("todoMsg", `Listo. Coincidencias: ${filtered.length} (mostrando ${shown.length}).`);
  } catch (err) {
    setMsg("todoMsg", "Error: " + err.message);
    clearWrap("todoTableWrap");
  }
}

function renderCatFactsList(facts) {
  const headers = ["#", "Dato", "Longitud"];
  const rows = (facts || []).map((f, idx) => ([
    String(idx + 1),
    f.fact ?? "N/A",
    String(f.length ?? "")
  ]));
  renderTable("catTableWrap", headers, rows);
}

async function buscarCatFacts(query) {
  const q = (query ?? "").trim();

  try {
    setMsg("catMsg", "Cargando...");
    clearWrap("catTableWrap");

    const data = await fetchJson(`${URL_CAT_FACTS}?limit=50&max_length=140`);
    const items = Array.isArray(data?.data) ? data.data : [];

    const needle = q.toLowerCase();
    const filtered = needle
      ? items.filter(it => (it.fact ?? "").toLowerCase().includes(needle))
      : items;

    const shown = filtered.slice(0, 20);
    renderCatFactsList(shown);
    setMsg("catMsg", `Listo. Coincidencias: ${filtered.length} (mostrando ${shown.length}).`);
  } catch (err) {
    setMsg("catMsg", "Error: " + err.message);
    clearWrap("catTableWrap");
  }
}

async function handleSearch(raw) {
  const query = (raw ?? "").trim();

  if (activeApi !== "poke") clearSection("pokeMsg", "pokeTableWrap");
  if (activeApi !== "todo") clearSection("todoMsg", "todoTableWrap");
  if (activeApi !== "cat") clearSection("catMsg", "catTableWrap");

  if (activeApi === "poke") return buscarPokemon(query);
  if (activeApi === "todo") return buscarTodos(query);
  if (activeApi === "cat") return buscarCatFacts(query);
}

function setActiveApi(api) {
  activeApi = api;

  if (api === "poke") setMsg("pokeMsg", "API seleccionada. Busca por nombre o ID (ej: pikachu, 25).");
  if (api === "todo") setMsg("todoMsg", "API seleccionada. Busca por id (1), userId:1 o palabra del título.");
  if (api === "cat") setMsg("catMsg", "API seleccionada. Busca por palabra (ej: sleep).");

  const input = document.getElementById("queryInput");
  if (input) input.focus();
}

document.getElementById("btnPoke").addEventListener("click", () => setActiveApi("poke"));
document.getElementById("btnTodo").addEventListener("click", () => setActiveApi("todo"));
document.getElementById("btnCat").addEventListener("click", () => setActiveApi("cat"));

const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");

if (searchForm && queryInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch(queryInput.value);
  });
}

setActiveApi("poke");
