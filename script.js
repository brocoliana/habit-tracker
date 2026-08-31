const STORAGE_KEY = "notion-habit-tracker-v1";

const defaultState = {
  settings: {
    title: "DAILY 🔥",
    habits: [
      { id: "habit-1", name: "arrumar quarto" },
      { id: "habit-2", name: "aspirar a casa" },
      { id: "habit-3", name: "escovar dentes" },
      { id: "habit-4", name: "lavar louça" },
      { id: "habit-5", name: "limpar areia" },
      { id: "habit-6", name: "responder wpp" },
      { id: "habit-7", name: "checar SLP" }
    ]
  },
  weeks: {}
};

let state = loadState();
let currentWeekStart = getMonday(new Date());

const widgetTitle = document.getElementById("widgetTitle");
const dateRange = document.getElementById("dateRange");
const daysHeader = document.getElementById("daysHeader");
const habitsGrid = document.getElementById("habitsGrid");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved
      ? {
          settings: { ...defaultState.settings, ...saved.settings },
          weeks: saved.weeks || {}
        }
      : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toISODate(date) {
  const local = new Date(date);
  local.setHours(12, 0, 0, 0);
  return local.toISOString().slice(0, 10);
}

function getMonday(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function getWeekKey() {
  return toISODate(currentWeekStart);
}

function formatRange(start) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  const optionsStart = { month: "short", day: "numeric" };
  const optionsEnd = sameMonth
    ? { day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };

  let startText = start.toLocaleDateString("en-US", optionsStart);
  let endText = end.toLocaleDateString("en-US", optionsEnd);

  if (!sameYear) {
    startText = start.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  return `${startText} – ${endText}`;
}

function getWeekData() {
  const key = getWeekKey();
  if (!state.weeks[key]) state.weeks[key] = {};
  return state.weeks[key];
}

function isFuture(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const comparison = new Date(date);
  comparison.setHours(0, 0, 0, 0);
  return comparison > today;
}

function render() {
  widgetTitle.textContent = state.settings.title;
  dateRange.textContent = formatRange(currentWeekStart);

  daysHeader.innerHTML = "";
  habitsGrid.innerHTML = "";

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const date = addDays(currentWeekStart, i);
    const day = document.createElement("div");
    day.className = "day-header";
    day.innerHTML = `
      <span class="day-name">${dayNames[i]}</span>
      <span class="day-number">${date.getDate()}</span>
    `;
    daysHeader.appendChild(day);
  }

  const weekData = getWeekData();

  state.settings.habits.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";

    const name = document.createElement("div");
    name.className = "habit-name";
    name.textContent = habit.name;

    const checks = document.createElement("div");
    checks.className = "checks";

    for (let i = 0; i < 7; i++) {
      const date = addDays(currentWeekStart, i);
      const dateKey = toISODate(date);
      const button = document.createElement("button");
      button.className = "check";
      button.type = "button";
      button.setAttribute("aria-label", `${habit.name} on ${dateKey}`);

      const completed = Boolean(weekData?.[habit.id]?.[dateKey]);
      if (completed) button.classList.add("completed");

      if (isFuture(date)) {
        button.disabled = true;
      }

      button.addEventListener("click", () => {
        const data = getWeekData();
        if (!data[habit.id]) data[habit.id] = {};
        data[habit.id][dateKey] = !data[habit.id][dateKey];
        saveState();
        render();
      });

      checks.appendChild(button);
    }

    row.append(name, checks);
    habitsGrid.appendChild(row);
  });

  saveState();
}

document.getElementById("prevWeek").addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  render();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  render();
});

document.getElementById("todayWeek").addEventListener("click", () => {
  currentWeekStart = getMonday(new Date());
  render();
});

/* SETTINGS */

const settingsDialog = document.getElementById("settingsDialog");
const titleInput = document.getElementById("titleInput");
const habitEditor = document.getElementById("habitEditor");

document.getElementById("settingsButton").addEventListener("click", () => {
  renderSettings();
  settingsDialog.showModal();
});

function renderSettings() {
  titleInput.value = state.settings.title;
  habitEditor.innerHTML = "";

  state.settings.habits.forEach((habit, index) => {
    const row = document.createElement("div");
    row.className = "editor-row";

    const input = document.createElement("input");
    input.value = habit.name;
    input.dataset.habitId = habit.id;

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.disabled = index === 0;
    up.addEventListener("click", () => {
      [state.settings.habits[index - 1], state.settings.habits[index]] =
        [state.settings.habits[index], state.settings.habits[index - 1]];
      renderSettings();
    });

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.disabled = index === state.settings.habits.length - 1;
    down.addEventListener("click", () => {
      [state.settings.habits[index + 1], state.settings.habits[index]] =
        [state.settings.habits[index], state.settings.habits[index + 1]];
      renderSettings();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.settings.habits.splice(index, 1);
      renderSettings();
    });

    row.append(input, up, down, remove);
    habitEditor.appendChild(row);
  });
}

document.getElementById("addHabit").addEventListener("click", () => {
  state.settings.habits.push({
    id: `habit-${Date.now()}`,
    name: "new habit"
  });
  renderSettings();
});

document.getElementById("saveSettings").addEventListener("click", () => {
  state.settings.title = titleInput.value.trim() || "DAILY";

  habitEditor.querySelectorAll("input[data-habit-id]").forEach((input) => {
    const habit = state.settings.habits.find(
      (item) => item.id === input.dataset.habitId
    );
    if (habit) habit.name = input.value.trim() || "Untitled habit";
  });

  saveState();
  settingsDialog.close();
  render();
});

document.getElementById("resetCurrentWeek").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Clear all completion data for this displayed week?"
  );
  if (!confirmed) return;

  delete state.weeks[getWeekKey()];
  saveState();
  settingsDialog.close();
  render();
});

render();
