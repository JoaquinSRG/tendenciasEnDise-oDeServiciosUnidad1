const URL_POKE = "https://pokeapi.co/api/v2/pokemon/pikachu";
const URL_TODO = "https://jsonplaceholder.typicode.com/todos/1";
const URL_CAT  = "https://catfact.ninja/fact";

function renderKeyValueTable(containerId, rows) {
  const wrap = document.getElementById(containerId);

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
    else tdVal.textContent = r.value;

    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  wrap.innerHTML = "";
  wrap.appendChild(table);
}

function setMsg(id, text) {
  document.getElementById(id).textContent = text;
}

async function cargarYProcesar(url, msgId, tableWrapId, processorFn) {
  try {
    setMsg(msgId, "Cargando...");
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();

    const rows = processorFn(data);

    renderKeyValueTable(tableWrapId, rows);
    setMsg(msgId, "Listo.");
  } catch (err) {
    setMsg(msgId, "Error: " + err.message);
    document.getElementById(tableWrapId).innerHTML = "";
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

function procesarTodo(data) {
  const completed = !!data.completed;

  const state = document.createElement("span");
  state.className = completed ? "ok" : "no";
  state.textContent = completed ? "Completado" : "Pendiente";

  return [
    { key: "User ID", value: String(data.userId ?? "N/A") },
    { key: "Todo ID", value: String(data.id ?? "N/A") },
    { key: "Título", value: data.title ?? "N/A" },
    { key: "Estado", valueNode: state }
  ];
}

function procesarCat(data) {
  return [
    { key: "Dato", value: data.fact ?? "N/A" },
    { key: "Longitud", value: String(data.length ?? "N/A") }
  ];
}

document.getElementById("btnPoke").addEventListener("click", () => {
  cargarYProcesar(URL_POKE, "pokeMsg", "pokeTableWrap", procesarPoke);
});

document.getElementById("btnTodo").addEventListener("click", () => {
  cargarYProcesar(URL_TODO, "todoMsg", "todoTableWrap", procesarTodo);
});

document.getElementById("btnCat").addEventListener("click", () => {
  cargarYProcesar(URL_CAT, "catMsg", "catTableWrap", procesarCat);
});
