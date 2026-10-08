const GRID_SIZE = 5;
const TOTAL_TASKS = 25;
const RANKING_KEY = "masCalculationRanking5x5";

const modeSelect = document.getElementById("modeSelect");
const timeLimitInput = document.getElementById("timeLimitInput");
const usernameInput = document.getElementById("usernameInput");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const checkBtn = document.getElementById("checkBtn");
const grid = document.getElementById("grid");
const headerRow = document.getElementById("headerRow");
const sideCol = document.getElementById("sideCol");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const resultSection = document.getElementById("resultSection");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultTime = document.getElementById("resultTime");
const registerBtn = document.getElementById("registerBtn");
const registeredMsg = document.getElementById("registeredMsg");
const rankingList = document.getElementById("rankingList");

let tasks = [];
let verticalNumbers = [];
let horizontalNumbers = [];
let timerId = null;
let timeLeft = 180;
let elapsedTime = 0;
let isAnswered = false;
let currentMode = "add";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOperation(mode) {
  if (mode === "add") return "+";
  if (mode === "sub") return "-";
  return "×";
}

function getAnswer(vertical, horizontal, mode) {
  if (mode === "add") return vertical + horizontal;
  if (mode === "sub") return vertical - horizontal;
  return vertical * horizontal;
}

function generateNumbers(mode) {
  verticalNumbers = [];
  horizontalNumbers = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    if (mode === "mul") {
      verticalNumbers.push(randomInt(2, 9));
      horizontalNumbers.push(randomInt(2, 9));
    } else if (mode === "sub") {
      verticalNumbers.push(randomInt(10, 99));
      horizontalNumbers.push(randomInt(1, 9));
    } else {
      verticalNumbers.push(randomInt(1, 99));
      horizontalNumbers.push(randomInt(1, 99));
    }
  }
}

function createTask(vertical, horizontal, mode) {
  const answer = getAnswer(vertical, horizontal, mode);
  return {
    vertical,
    horizontal,
    answer,
    userInput: "",
    isCorrect: null
  };
}

function generateTasks(mode) {
  currentMode = mode;
  generateNumbers(mode);
  tasks = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const vertical = verticalNumbers[row];
      const horizontal = horizontalNumbers[col];
      tasks.push(createTask(vertical, horizontal, mode));
    }
  }
}

function renderHeaderRow() {
  headerRow.innerHTML = "";
  horizontalNumbers.forEach((num) => {
    const cell = document.createElement("div");
    cell.className = "header-cell";
    cell.textContent = num;
    headerRow.appendChild(cell);
  });
}

function renderSideCol() {
  sideCol.innerHTML = "";
  verticalNumbers.forEach((num) => {
    const cell = document.createElement("div");
    cell.className = "side-cell";
    cell.textContent = num;
    sideCol.appendChild(cell);
  });
}

function renderTasks() {
  grid.innerHTML = "";

  tasks.forEach((task, index) => {
    const cell = document.createElement("div");
    cell.className = "task";

    if (task.isCorrect === true) {
      cell.classList.add("correct");
    } else if (task.isCorrect === false) {
      cell.classList.add("wrong");
    }

    const input = document.createElement("input");
    input.type = "number";
    input.value = task.userInput;
    input.setAttribute("aria-label", `問題 ${index + 1}`);
    input.disabled = isAnswered;

    input.addEventListener("input", (e) => {
      task.userInput = e.target.value;
    });

    cell.appendChild(input);
    grid.appendChild(cell);
  });
}

function updateTimer() {
  timerEl.textContent = String(timeLeft);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function gradeAnswers() {
  let correctCount = 0;

  tasks.forEach((task) => {
    const userValue = Number(task.userInput);
    const isCorrect = !Number.isNaN(userValue) && userValue === task.answer;

    task.isCorrect = isCorrect;
    if (isCorrect) correctCount++;
  });

  scoreEl.textContent = String(correctCount);
  isAnswered = true;
  stopTimer();
  renderTasks();
  showResult(correctCount);
}

function showResult(correctCount) {
  const isPerfect = correctCount === TOTAL_TASKS;
  const timeUsed = elapsedTime;

  resultTitle.textContent = isPerfect ? "🎉 満点です！" : "採点完了";
  resultScore.textContent = correctCount;
  resultTime.textContent = timeUsed;

  resultSection.classList.remove("hidden");

  if (isPerfect) {
    registerBtn.classList.remove("hidden");
    registerBtn.addEventListener(
      "click",
      () => registerToRanking(correctCount, timeUsed),
      { once: true }
    );
  } else {
    registerBtn.classList.add("hidden");
  }
}

function registerToRanking(score, time) {
  const username = usernameInput.value.trim();

  if (!username) {
    alert("ユーザー名を入力してください");
    return;
  }

  const ranking = getRanking();
  ranking.push({
    name: username,
    score,
    time,
    date: new Date().toISOString()
  });

  ranking.sort((a, b) => a.time - b.time);
  saveRanking(ranking);

  registerBtn.classList.add("hidden");
  registeredMsg.classList.remove("hidden");
  renderRanking();
}

function getRanking() {
  const data = localStorage.getItem(RANKING_KEY);
  return data ? JSON.parse(data) : [];
}

function saveRanking(ranking) {
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

function renderRanking() {
  const ranking = getRanking();

  if (ranking.length === 0) {
    rankingList.innerHTML = '<p class="muted">まだランキング記録がありません</p>';
    return;
  }

  rankingList.innerHTML = "";

  ranking.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = "ranking-item";

    if (index === 0) item.classList.add("gold");
    else if (index === 1) item.classList.add("silver");
    else if (index === 2) item.classList.add("bronze");

    const rank = document.createElement("div");
    rank.className = "rank-num";
    if (index === 0) rank.classList.add("gold");
    if (index === 1) rank.classList.add("silver");
    if (index === 2) rank.classList.add("bronze");
    rank.textContent = index + 1;

    const name = document.createElement("div");
    name.className = "rank-name";
    name.textContent = entry.name;

    const time = document.createElement("div");
    time.className = "rank-time";
    time.textContent = `${entry.time}秒`;

    item.appendChild(rank);
    item.appendChild(name);
    item.appendChild(time);
    rankingList.appendChild(item);
  });
}

function startGame() {
  const mode = modeSelect.value;
  const limit = Number(timeLimitInput.value);

  timeLeft = Number.isFinite(limit) && limit > 0 ? limit : 180;
  elapsedTime = 0;
  isAnswered = false;
  scoreEl.textContent = "0";
  updateTimer();

  resultSection.classList.add("hidden");
  registeredMsg.classList.add("hidden");
  registerBtn.classList.add("hidden");

  generateTasks(mode);
  renderHeaderRow();
  renderSideCol();
  renderTasks();

  stopTimer();
  timerId = setInterval(() => {
    timeLeft -= 1;
    elapsedTime += 1;
    updateTimer();

    if (timeLeft <= 0) gradeAnswers();
  }, 1000);
}

function resetGame() {
  stopTimer();
  scoreEl.textContent = "0";
  timeLeft = Number(timeLimitInput.value) || 180;
  elapsedTime = 0;
  updateTimer();
  isAnswered = false;
  resultSection.classList.add("hidden");
  registeredMsg.classList.add("hidden");
  registerBtn.classList.add("hidden");

  generateTasks(modeSelect.value);
  renderHeaderRow();
  renderSideCol();
  renderTasks();
}

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
checkBtn.addEventListener("click", gradeAnswers);

generateTasks(modeSelect.value);
renderHeaderRow();
renderSideCol();
renderTasks();
renderRanking();
