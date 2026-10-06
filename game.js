const WORD_SETS = {
  hd: [
    // HD, The Pool
    "are", "you", "alive",
    "i", "touch", "you",
    "you", "quiver", "like", "seafish",
    "i", "cover", "you", "with", "my", "net",
    "what", "are", "you",
    "banded", "one"
  ],
  mengna: [
    // a little poem written by me thinking about mimics in Corrypt
    "broken", "string",
    "blowing", "wind",
    "ghost", "mimicing", "glitches",
    "dream", "drowning", "in", "limbo",
    "you", "are", "my", "withering", "obsession"
  ],
  droqen: [
    // droqen's poem inspired by michael brough's style
    "twisted", "and", "flat", "organ", "-isms",
    "the", "computer", "receives", "commands",
    "glitch", "-like", "and", "deferential", "too",
    "login", "with", "password", "for", "access",
    "drag", "your", "feet", "and", "thieve", "-achieve",
    "supreme", "control", "over", "a", "plane",
    "and", "a", "vector", "for", "dis-", "ease",
    "hacker"
  ],
  moon: [
    "海", "上", "生", "明", "月",
    "天", "涯", "共", "此", "时"
  ]
};

const POEM_KEYS = Object.keys(WORD_SETS);

const gridEl = document.getElementById("grid");
const ghostGridEl = document.getElementById("ghost-grid");
const poemEl = document.getElementById("poem");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const sizeOptions = document.getElementById("setting-size");
const poemOptions = document.getElementById("setting-poem");
const ghostOptions = document.getElementById("setting-ghost");

const settings = {
  size: 5,
  poem: "random",
  ghost: true,
};

const state = {
  cells: [],
  ghostCells: [],
  player: { row: 0, col: 0 },
  ghost: { row: 0, col: 0 },
  poem: [],
};

function index(row, col) {
  return row * settings.size + col;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function shuffle(items) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function cellSizeFor(size) {
  return Math.max(60, Math.floor(340 / size));
}

function createEmptyCells() {
  return Array.from({ length: settings.size * settings.size }, () => ({ word: null }));
}

function boardCount() {
  return settings.ghost ? 2 : 1;
}

function availableSlots(excludedByBoard) {
  const slots = [];
  for (let board = 0; board < boardCount(); board += 1) {
    const excluded = new Set(
      (excludedByBoard[board] || []).map(({ row, col }) => index(row, col))
    );
    for (let row = 0; row < settings.size; row += 1) {
      for (let col = 0; col < settings.size; col += 1) {
        if (excluded.has(index(row, col))) continue;
        slots.push({ board, row, col });
      }
    }
  }
  return slots;
}

function distributeWords(words, boards, excludedByBoard) {
  const shuffledWords = shuffle(words);
  const slots = shuffle(availableSlots(excludedByBoard));
  const count = Math.min(shuffledWords.length, slots.length);

  for (let i = 0; i < count; i += 1) {
    const { board, row, col } = slots[i];
    boards[board][index(row, col)].word = shuffledWords[i];
  }
}

function chosenWords() {
  if (settings.poem === "random") {
    return WORD_SETS[POEM_KEYS[randomInt(POEM_KEYS.length)]];
  }
  return WORD_SETS[settings.poem];
}

function setupBoard() {
  state.cells = createEmptyCells();
  state.ghostCells = createEmptyCells();
  state.poem = [];

  state.player = {
    row: randomInt(settings.size),
    col: randomInt(settings.size),
  };
  state.ghost = {
    row: randomInt(settings.size),
    col: randomInt(settings.size),
  };

  const boards = settings.ghost
    ? [state.cells, state.ghostCells]
    : [state.cells];
  const excluded = settings.ghost
    ? [[state.player], [state.ghost]]
    : [[state.player]];

  distributeWords(chosenWords(), boards, excluded);
}

function collectFrom(cells, actor) {
  const cell = cells[index(actor.row, actor.col)];
  if (!cell.word) return;
  state.poem.push(cell.word);
  cell.word = null;
}

function renderBoard(targetEl, cells, actor, playerClass) {
  targetEl.style.setProperty("--grid-size", settings.size);
  targetEl.style.setProperty("--cell-size", `${cellSizeFor(settings.size)}px`);
  targetEl.innerHTML = "";

  for (let row = 0; row < settings.size; row += 1) {
    for (let col = 0; col < settings.size; col += 1) {
      const cell = cells[index(row, col)];
      const el = document.createElement("div");
      el.className = "cell";
      el.setAttribute("role", "gridcell");

      if (cell.word) {
        el.classList.add("has-word");
        el.textContent = cell.word;
      }

      if (row === actor.row && col === actor.col) {
        el.classList.add(playerClass);
      }

      targetEl.appendChild(el);
    }
  }
}

function formatPoem(tokens) {
  let text = "";
  for (const token of tokens) {
    if (token === "\n") {
      text += "\n";
      continue;
    }
    if (text && !text.endsWith("\n")) text += " ";
    text += token;
  }
  return text;
}

function renderPoem() {
  poemEl.replaceChildren();

  if (state.poem.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "poem-placeholder";
    placeholder.textContent = "your poem will appear here";
    poemEl.appendChild(placeholder);
    poemEl.classList.add("empty");
  } else {
    const text = document.createElement("span");
    text.className = "poem-text";
    text.textContent = formatPoem(state.poem);
    poemEl.appendChild(text);
    poemEl.classList.remove("empty");
  }

  const caret = document.createElement("span");
  caret.className = "poem-caret";
  caret.setAttribute("aria-hidden", "true");
  poemEl.appendChild(caret);
}

function render() {
  renderBoard(gridEl, state.cells, state.player, "player");
  ghostGridEl.classList.toggle("is-hidden", !settings.ghost);
  if (settings.ghost) {
    renderBoard(ghostGridEl, state.ghostCells, state.ghost, "ghost-player");
  } else {
    ghostGridEl.innerHTML = "";
  }
  renderPoem();
}

function moveActor(actor, dRow, dCol) {
  const nextRow = actor.row + dRow;
  const nextCol = actor.col + dCol;
  if (
    nextRow < 0 ||
    nextRow >= settings.size ||
    nextCol < 0 ||
    nextCol >= settings.size
  ) {
    return false;
  }
  actor.row = nextRow;
  actor.col = nextCol;
  return true;
}

function tryMove(dRow, dCol) {
  const movedMain = moveActor(state.player, dRow, dCol);
  const movedGhost = settings.ghost
    ? moveActor(state.ghost, dRow, dCol)
    : false;
  if (!movedMain && !movedGhost) return;

  if (movedMain) collectFrom(state.cells, state.player);
  if (movedGhost) collectFrom(state.ghostCells, state.ghost);
  render();
}

function restartFromSettings() {
  setupBoard();
  render();
}

function markActive(groupEl, value) {
  groupEl.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.value === String(value));
  });
}

function syncControls() {
  markActive(sizeOptions, settings.size);
  markActive(poemOptions, settings.poem);
  markActive(ghostOptions, settings.ghost ? "on" : "off");
}

function isSettingsOpen() {
  return !settingsPanel.hasAttribute("hidden");
}

function setSettingsOpen(open) {
  if (open) {
    settingsPanel.removeAttribute("hidden");
  } else {
    settingsPanel.setAttribute("hidden", "");
  }
  settingsToggle.setAttribute("aria-expanded", String(open));
}

settingsToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  setSettingsOpen(!isSettingsOpen());
});

settingsPanel.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", (event) => {
  if (!isSettingsOpen()) return;
  if (event.target.closest(".settings")) return;
  setSettingsOpen(false);
});

function bindOptionGroup(groupEl, onPick) {
  groupEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button || !groupEl.contains(button)) return;
    onPick(button.dataset.value);
    syncControls();
    restartFromSettings();
  });
}

bindOptionGroup(sizeOptions, (value) => {
  settings.size = Number(value);
});

bindOptionGroup(poemOptions, (value) => {
  settings.poem = value;
});

bindOptionGroup(ghostOptions, (value) => {
  settings.ghost = value === "on";
});

const KEY_MOVES = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    state.poem.push("\n");
    renderPoem();
    return;
  }

  const move = KEY_MOVES[event.key];
  if (!move) return;
  event.preventDefault();
  tryMove(move[0], move[1]);
});

syncControls();
setupBoard();
render();
