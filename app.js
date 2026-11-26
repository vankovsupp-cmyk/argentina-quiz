/* ==========================================================================
   Presentación sobre Argentina · Real-time Multiplayer Quiz
   Firebase Realtime Database (Compat SDK v10)
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBWC_FCpoYda9tDeON_bnq_DYpSjVuAagY",
  authDomain: "argentina-quiz.firebaseapp.com",
  databaseURL: "https://argentina-quiz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "argentina-quiz",
  storageBucket: "argentina-quiz.firebasestorage.app",
  messagingSenderId: "94118854334",
  appId: "1:94118854334:web:a26b784afb6b9b1cb668ef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const QUESTION_DURATION = 40; // seconds
const LETTERS = ["A", "B", "C", "D"];

/* ==========================================================================
   15 SPANISH QUESTIONS ABOUT ARGENTINA
   ========================================================================== */
const QUESTIONS = [
  {
    q: "¿De qué palabra latina viene el nombre «Argentina» y qué significa?",
    options: [
      "De «argentum», que significa plata",
      "De «aurum», que significa oro",
      "De «agua», por el río de la Plata",
      "De «australis», que significa sur"
    ],
    correct: 0
  },
  {
    q: "¿Qué lugar es Argentina por su tamaño en el mundo y en Sudamérica?",
    options: [
      "El quinto en el mundo y el primero en Sudamérica",
      "El octavo en el mundo y el segundo en Sudamérica (después de Brasil)",
      "El décimo en el mundo y el tercero en Sudamérica",
      "El sexto en el mundo y el segundo en Sudamérica"
    ],
    correct: 1
  },
  {
    q: "¿Cómo se llama el barrio famoso de Buenos Aires donde las casas están pintadas de colores muy alegres?",
    options: [
      "Palermo",
      "Recoleta",
      "La Boca",
      "San Telmo"
    ],
    correct: 2
  },
  {
    q: "¿Con cuántos países tiene fronteras Argentina?",
    options: [
      "Con tres países (Chile, Brasil y Uruguay)",
      "Con cuatro países (Chile, Bolivia, Brasil y Uruguay)",
      "Con cinco países (Chile, Bolivia, Paraguay, Brasil y Uruguay)",
      "Con seis países (Chile, Perú, Bolivia, Paraguay, Brasil y Uruguay)"
    ],
    correct: 2
  },
  {
    q: "¿Cuál es la montaña más alta de toda América y del hemisferio sur, ubicada en los Andes argentinos?",
    options: [
      "El monte Fitz Roy (3.405 m)",
      "El monte Aconcagua (6.961 m)",
      "El volcán Ojos del Salado (6.893 m)",
      "El cerro Catedral (2.388 m)"
    ],
    correct: 1
  },
  {
    q: "¿Cómo se llaman los jinetes tradicionales que viven y trabajan en las llanuras verdes de las Pampas?",
    options: [
      "Charros",
      "Llaneros",
      "Gauchos",
      "Huasos"
    ],
    correct: 2
  },
  {
    q: "¿Cuándo es el verano en Argentina?",
    options: [
      "De junio a septiembre",
      "De diciembre a marzo",
      "De marzo a junio",
      "De septiembre a diciembre"
    ],
    correct: 1
  },
  {
    q: "¿Qué día y en qué año declaró Argentina oficialmente su independencia de España?",
    options: [
      "El 25 de mayo de 1810",
      "El 9 de julio de 1816",
      "El 20 de junio de 1820",
      "El 12 de octubre de 1812"
    ],
    correct: 1
  },
  {
    q: "¿Quién fue el gran héroe militar que cruzó los Andes con su ejército para liberar Argentina, Chile y Perú?",
    options: [
      "Simón Bolívar",
      "Manuel Belgrano",
      "El general José de San Martín",
      "Domingo Faustino Sarmiento"
    ],
    correct: 2
  },
  {
    q: "¿De qué dos países europeos llegaron millones de inmigrantes en barco a finales del siglo XIX y principios del XX?",
    options: [
      "Francia y Portugal",
      "Italia y España",
      "Alemania y Reino Unido",
      "Irlanda y Polonia"
    ],
    correct: 1
  },
  {
    q: "¿Cuántas Copas del Mundo ha ganado la selección de fútbol de Argentina («La Albiceleste») y en qué años?",
    options: [
      "Dos: en 1978 y 1986",
      "Tres: en 1978, 1986 y 2022",
      "Cuatro: en 1978, 1986, 2014 y 2022",
      "Cinco: en 1930, 1978, 1986, 1990 y 2022"
    ],
    correct: 1
  },
  {
    q: "¿Cómo se llama el partido de fútbol entre los dos clubes históricos Boca Juniors y River Plate?",
    options: [
      "El Derbi Porteño",
      "El Gran Clásico del Sur",
      "El Superclásico",
      "La Final Albiceleste"
    ],
    correct: 2
  },
  {
    q: "¿Qué instrumento musical especial es típico del tango argentino?",
    options: [
      "El charango",
      "El bandoneón",
      "La quena",
      "El cajón peruano"
    ],
    correct: 1
  },
  {
    q: "¿Cuál es el plato más típico de Argentina y cuál es su bebida tradicional compartida como símbolo de amistad?",
    options: [
      "Empanadas y sangría",
      "Milanesa y café cortado",
      "Asado y mate",
      "Locro y chicha"
    ],
    correct: 2
  },
  {
    q: "¿Por qué llaman a la ciudad de Ushuaia «El fin del mundo»?",
    options: [
      "Porque está rodeada por el desierto más seco del planeta",
      "Porque es la ciudad más austral del mundo (la más cercana al Polo Sur)",
      "Porque fue la última ciudad fundada en Sudamérica",
      "Porque se encuentra en la cima de los Andes"
    ],
    correct: 1
  }
];

/* ==========================================================================
   SERVER TIME OFFSET (keeps countdown synchronized across phones & board)
   ========================================================================== */
let serverTimeOffset = 0;
db.ref(".info/serverTimeOffset").on("value", (snap) => {
  serverTimeOffset = snap.val() || 0;
});

function serverNow() {
  return Date.now() + serverTimeOffset;
}

/* ==========================================================================
   SHARED DOM REFERENCES & HELPERS
   ========================================================================== */
const $ = (id) => document.getElementById(id);

const screens = {
  home: $("screen-home"),
  host: $("screen-host"),
  player: $("screen-player")
};

const hostViews = {
  lobby: $("host-view-lobby"),
  question: $("host-view-question"),
  leaderboard: $("host-view-leaderboard"),
  podium: $("host-view-podium")
};

const playerViews = {
  join: $("player-view-join"),
  game: $("player-view-game")
};

const playerSubstates = {
  lobby: $("player-state-lobby"),
  question: $("player-state-question"),
  waiting: $("player-state-waiting"),
  feedback: $("player-state-feedback"),
  podium: $("player-state-podium")
};

let toastTimer = null;
function showToast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 3200);
}

function showScreen(name) {
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle("active", key === name);
  });
}

function showHostView(name) {
  Object.keys(hostViews).forEach((key) => {
    hostViews[key].classList.toggle("active", key === name);
  });
}

function showPlayerView(name) {
  Object.keys(playerViews).forEach((key) => {
    playerViews[key].classList.toggle("active", key === name);
  });
}

function showPlayerSubstate(name) {
  Object.keys(playerSubstates).forEach((key) => {
    playerSubstates[key].classList.toggle("active", key === name);
  });
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generatePlayerId() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function buildJoinUrl(pin) {
  const base = window.location.href.split("?")[0].split("#")[0];
  return `${base}?pin=${encodeURIComponent(pin)}`;
}

function getSortedPlayers(playersObj) {
  if (!playersObj) return [];
  return Object.entries(playersObj)
    .map(([id, data]) => ({
      id,
      name: (data && data.name) || "Jugador",
      score: Number((data && data.score) || 0),
      joinedAt: Number((data && data.joinedAt) || 0),
      correctCount: Number((data && data.correctCount) || 0)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.joinedAt - b.joinedAt;
    });
}

function computeRemainingSeconds(startedAt, duration = QUESTION_DURATION) {
  if (!startedAt) return duration;
  const elapsed = (serverNow() - startedAt) / 1000;
  return Math.max(0, Math.min(duration, duration - elapsed));
}

/* ==========================================================================
   HOST MODE STATE & LOGIC
   ========================================================================== */
const hostState = {
  pin: null,
  status: null,
  currentQuestion: 0,
  questionStartedAt: 0,
  players: {},
  answersForCurrent: {},
  timerInterval: null,
  roomRef: null,
  playersRef: null,
  answersRef: null,
  renderedQuestionIndex: -1,
  lastDisplayedSec: -1
};

function cleanupHostListeners() {
  if (hostState.timerInterval) {
    clearInterval(hostState.timerInterval);
    hostState.timerInterval = null;
  }
  if (hostState.playersRef) {
    hostState.playersRef.off();
    hostState.playersRef = null;
  }
  if (hostState.answersRef) {
    hostState.answersRef.off();
    hostState.answersRef = null;
  }
  if (hostState.roomRef) {
    hostState.roomRef.off();
    hostState.roomRef = null;
  }
}

async function startHostSession() {
  cleanupHostListeners();
  showScreen("host");
  showHostView("lobby");

  // Reset lobby DOM cleanly
  $("host-players-list").innerHTML = "";
  $("host-players-empty").classList.remove("hidden");
  $("host-lobby-count").textContent = "0";
  $("host-topbar-players").textContent = "0";

  // Find a fresh 4-digit PIN
  let pin = generatePin();
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const snap = await db.ref(`rooms/${pin}`).once("value");
      if (!snap.exists()) break;
      pin = generatePin();
    }
  } catch (err) {
    showToast("Error de conexión con Firebase. Revisa tu conexión.");
  }

  hostState.pin = pin;
  hostState.status = "lobby";
  hostState.currentQuestion = 0;
  hostState.players = {};
  hostState.answersForCurrent = {};
  hostState.renderedQuestionIndex = -1;

  $("host-topbar-pin").textContent = pin;
  $("host-lobby-pin").textContent = pin;

  const joinUrl = buildJoinUrl(pin);
  $("host-join-url").textContent = joinUrl;
  $("host-qr-img").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" +
    encodeURIComponent(joinUrl);

  hostState.roomRef = db.ref(`rooms/${pin}`);
  await hostState.roomRef.set({
    status: "lobby",
    currentQuestion: 0,
    questionDuration: QUESTION_DURATION,
    questionStartedAt: 0,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  });

  // Listen incrementally to players so DOM never flashes or jumps
  hostState.playersRef = db.ref(`rooms/${pin}/players`);
  hostState.playersRef.on("value", (snap) => {
    const val = snap.val() || {};
    hostState.players = val;
    syncHostPlayersUI(val);
    updateHostResponseCounter();
    if (hostState.status === "leaderboard") {
      renderHostLeaderboard();
    } else if (hostState.status === "podium") {
      renderHostPodium();
    }
  });
}

function syncHostPlayersUI(playersObj) {
  const listEl = $("host-players-list");
  const emptyEl = $("host-players-empty");
  const ids = Object.keys(playersObj);
  const countStr = String(ids.length);

  // Direct textContent updates only
  $("host-topbar-players").textContent = countStr;
  $("host-lobby-count").textContent = countStr;
  emptyEl.classList.toggle("hidden", ids.length > 0);

  // Incremental DOM sync (no full innerHTML wipe)
  const existingNodes = new Map();
  Array.from(listEl.children).forEach((li) => {
    existingNodes.set(li.dataset.playerId, li);
  });

  ids.forEach((id) => {
    const name = (playersObj[id] && playersObj[id].name) || "Jugador";
    if (existingNodes.has(id)) {
      const li = existingNodes.get(id);
      if (li.textContent !== name) li.textContent = name;
      existingNodes.delete(id);
    } else {
      const li = document.createElement("li");
      li.className = "player-chip";
      li.dataset.playerId = id;
      li.textContent = name;
      listEl.appendChild(li);
    }
  });

  existingNodes.forEach((li) => li.remove());
}

function getHostResponseCounts() {
  const activePlayerIds = Object.keys(hostState.players);
  const totalPlayers = activePlayerIds.length;
  const answeredCount = activePlayerIds.filter((id) =>
    Boolean(hostState.answersForCurrent && hostState.answersForCurrent[id])
  ).length;
  return { answeredCount, totalPlayers };
}

function updateHostResponseCounter() {
  const { answeredCount, totalPlayers } = getHostResponseCounts();
  $("host-resp-answered").textContent = String(answeredCount);
  $("host-resp-total").textContent = String(totalPlayers);

  // Auto-reveal immediately when 100% of active players have answered
  if (
    hostState.status === "question" &&
    totalPlayers > 0 &&
    answeredCount >= totalPlayers
  ) {
    hostRevealAnswer();
  }
}

function attachHostAnswersListener(questionIndex) {
  if (hostState.answersRef) {
    hostState.answersRef.off();
  }
  hostState.answersForCurrent = {};
  updateHostResponseCounter();

  hostState.answersRef = db.ref(`rooms/${hostState.pin}/answers/${questionIndex}`);
  hostState.answersRef.on("value", (snap) => {
    hostState.answersForCurrent = snap.val() || {};
    // During active question: update ONLY the calm "Respuestas: X / Y" textContent
    // and auto-finish if 100% of active players answered.
    // NEVER show percentages or bars while status === "question"!
    updateHostResponseCounter();

    // If already revealed, keep percentages fresh in case a late packet lands
    if (hostState.status === "revealed") {
      updateHostRevealPercentages();
    }
  });
}

function loadHostQuestionDOM(questionIndex) {
  const qData = QUESTIONS[questionIndex];
  $("host-q-num").textContent = String(questionIndex + 1);
  $("host-q-total").textContent = String(QUESTIONS.length);
  $("host-question-text").textContent = qData.q;

  const grid = $("host-options-grid");
  grid.classList.remove("revealed");

  for (let i = 0; i < 4; i++) {
    const card = $(`host-opt-${i}`);
    card.classList.remove("is-correct", "is-dimmed");
    $(`host-opt-text-${i}`).textContent = qData.options[i];
    $(`host-opt-pct-${i}`).textContent = "0%";
    $(`host-opt-bar-${i}`).style.width = "0%";
  }

  $("btn-host-reveal").classList.remove("hidden");
  $("host-post-reveal-actions").classList.add("hidden");

  const isLast = questionIndex >= QUESTIONS.length - 1;
  $("btn-host-next").textContent = isLast ? "Ver Podio Final →" : "Siguiente Pregunta →";
  $("btn-lb-next").textContent = isLast ? "Ver Podio Final →" : "Siguiente Pregunta →";

  hostState.renderedQuestionIndex = questionIndex;
}

async function hostStartQuestion(questionIndex) {
  if (hostState.timerInterval) {
    clearInterval(hostState.timerInterval);
    hostState.timerInterval = null;
  }

  hostState.status = "question";
  hostState.currentQuestion = questionIndex;
  hostState.lastDisplayedSec = QUESTION_DURATION;

  loadHostQuestionDOM(questionIndex);
  showHostView("question");
  attachHostAnswersListener(questionIndex);

  // Set timer UI immediately
  $("host-timer-sec").textContent = String(QUESTION_DURATION);
  $("host-timer-bar").style.width = "100%";
  $("host-timer-pill").classList.remove("warning", "ended");

  const localStart = serverNow();
  hostState.questionStartedAt = localStart;

  await hostState.roomRef.update({
    status: "question",
    currentQuestion: questionIndex,
    questionStartedAt: firebase.database.ServerValue.TIMESTAMP,
    questionDuration: QUESTION_DURATION
  });

  // Read back exact server timestamp for precision
  const tsSnap = await hostState.roomRef.child("questionStartedAt").once("value");
  if (tsSnap.val()) {
    hostState.questionStartedAt = tsSnap.val();
  }

  if (hostState.status !== "question") return;

  hostState.timerInterval = setInterval(() => {
    if (hostState.status !== "question") {
      clearInterval(hostState.timerInterval);
      hostState.timerInterval = null;
      return;
    }

    const remaining = computeRemainingSeconds(hostState.questionStartedAt, QUESTION_DURATION);
    const displaySec = Math.ceil(remaining);

    if (displaySec !== hostState.lastDisplayedSec) {
      hostState.lastDisplayedSec = displaySec;
      $("host-timer-sec").textContent = String(displaySec);
    }

    const pct = Math.max(0, Math.min(100, (remaining / QUESTION_DURATION) * 100));
    $("host-timer-bar").style.width = `${pct.toFixed(1)}%`;

    const pill = $("host-timer-pill");
    if (remaining <= 5 && remaining > 0) {
      pill.classList.add("warning");
    }

    if (remaining <= 0) {
      clearInterval(hostState.timerInterval);
      hostState.timerInterval = null;
      hostRevealAnswer();
    }
  }, 150);
}

function updateHostRevealPercentages() {
  const answers = Object.values(hostState.answersForCurrent);
  const totalVotes = answers.length;
  const counts = [0, 0, 0, 0];

  answers.forEach((ans) => {
    if (ans && typeof ans.option === "number" && ans.option >= 0 && ans.option < 4) {
      counts[ans.option]++;
    }
  });

  for (let i = 0; i < 4; i++) {
    const pct = totalVotes > 0 ? Math.round((counts[i] / totalVotes) * 100) : 0;
    $(`host-opt-pct-${i}`).textContent = `${pct}%`;
    $(`host-opt-bar-${i}`).style.width = `${pct}%`;
  }
}

async function hostRevealAnswer() {
  if (hostState.status === "revealed") return;

  if (hostState.timerInterval) {
    clearInterval(hostState.timerInterval);
    hostState.timerInterval = null;
  }

  hostState.status = "revealed";
  $("host-timer-sec").textContent = "0";
  $("host-timer-bar").style.width = "0%";
  $("host-timer-pill").classList.remove("warning");
  $("host-timer-pill").classList.add("ended");

  const correctIdx = QUESTIONS[hostState.currentQuestion].correct;
  const grid = $("host-options-grid");
  grid.classList.add("revealed");

  for (let i = 0; i < 4; i++) {
    const card = $(`host-opt-${i}`);
    card.classList.toggle("is-correct", i === correctIdx);
    card.classList.toggle("is-dimmed", i !== correctIdx);
  }

  // ONLY NOW reveal percentages for A, B, C, and D
  updateHostRevealPercentages();

  $("btn-host-reveal").classList.add("hidden");
  $("host-post-reveal-actions").classList.remove("hidden");

  await hostState.roomRef.update({
    status: "revealed"
  });
}

function renderHostLeaderboard() {
  const sorted = getSortedPlayers(hostState.players);
  const top5 = sorted.slice(0, 5);
  const listEl = $("host-leaderboard-list");
  const emptyEl = $("host-leaderboard-empty");

  $("host-lb-q-num").textContent = String(hostState.currentQuestion + 1);
  listEl.innerHTML = "";
  emptyEl.classList.toggle("hidden", top5.length > 0);

  top5.forEach((p, idx) => {
    const rank = idx + 1;
    const li = document.createElement("li");
    li.className = `lb-row rank-${rank}`;

    const rankSpan = document.createElement("span");
    rankSpan.className = "lb-rank tabular";
    rankSpan.textContent = String(rank);

    const nameSpan = document.createElement("span");
    nameSpan.className = "lb-name";
    nameSpan.textContent = p.name;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "lb-score tabular";
    scoreSpan.textContent = `${p.score} pts`;

    li.append(rankSpan, nameSpan, scoreSpan);
    listEl.appendChild(li);
  });
}

async function hostShowLeaderboard() {
  hostState.status = "leaderboard";
  renderHostLeaderboard();
  showHostView("leaderboard");
  await hostState.roomRef.update({
    status: "leaderboard"
  });
}

function renderHostPodium() {
  const sorted = getSortedPlayers(hostState.players);

  for (let pos = 1; pos <= 3; pos++) {
    const player = sorted[pos - 1];
    $(`podium-name-${pos}`).textContent = player ? player.name : "—";
    $(`podium-score-${pos}`).textContent = player ? `${player.score} pts` : "0 pts";
  }

  const rest = sorted.slice(3, 10);
  const restCard = $("podium-rest-card");
  const restList = $("podium-rest-list");
  restList.innerHTML = "";

  if (rest.length > 0) {
    restCard.classList.remove("hidden");
    rest.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.name;
      const sc = document.createElement("span");
      sc.className = "podium-rest-score";
      sc.textContent = `(${p.score} pts)`;
      li.appendChild(sc);
      restList.appendChild(li);
    });
  } else {
    restCard.classList.add("hidden");
  }
}

async function hostAdvance() {
  const nextIndex = hostState.currentQuestion + 1;
  if (nextIndex < QUESTIONS.length) {
    await hostStartQuestion(nextIndex);
  } else {
    hostState.status = "podium";
    renderHostPodium();
    showHostView("podium");
    await hostState.roomRef.update({
      status: "podium"
    });
  }
}

/* ==========================================================================
   PLAYER MODE STATE & LOGIC
   ========================================================================== */
const playerState = {
  pin: null,
  playerId: null,
  name: "",
  score: 0,
  correctCount: 0,
  currentQuestion: -1,
  status: null,
  questionStartedAt: 0,
  answeredQuestions: {}, // { [qIdx]: { option, correct, points } }
  playersSnapshot: {},
  roomRef: null,
  timerInterval: null,
  lastDisplayedSec: -1
};

function cleanupPlayerListeners() {
  if (playerState.timerInterval) {
    clearInterval(playerState.timerInterval);
    playerState.timerInterval = null;
  }
  if (playerState.roomRef) {
    playerState.roomRef.off();
    playerState.roomRef = null;
  }
}

function showJoinError(msg) {
  const el = $("player-join-error");
  if (!msg) {
    el.classList.add("hidden");
    el.textContent = "";
  } else {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function openPlayerMode(prefillPin = "") {
  cleanupPlayerListeners();
  showScreen("player");
  showPlayerView("join");
  showJoinError("");

  const pinInput = $("input-pin");
  const nameInput = $("input-name");

  if (prefillPin) {
    pinInput.value = prefillPin.replace(/\D/g, "").slice(0, 4);
    setTimeout(() => nameInput.focus(), 50);
  } else {
    setTimeout(() => pinInput.focus(), 50);
  }
}

async function handlePlayerJoin(e) {
  e.preventDefault();
  showJoinError("");

  const pin = $("input-pin").value.replace(/\D/g, "").trim();
  const name = $("input-name").value.trim();

  if (pin.length !== 4) {
    showJoinError("Introduce un PIN válido de 4 dígitos.");
    $("input-pin").focus();
    return;
  }
  if (name.length < 1) {
    showJoinError("Escribe tu nombre para unirte.");
    $("input-name").focus();
    return;
  }

  const joinBtn = $("btn-player-join");
  joinBtn.disabled = true;
  joinBtn.textContent = "Conectando...";

  try {
    const roomSnap = await db.ref(`rooms/${pin}`).once("value");
    if (!roomSnap.exists()) {
      showJoinError(`No se encontró ninguna sala con el PIN ${pin}.`);
      joinBtn.disabled = false;
      joinBtn.textContent = "UNIRSE";
      return;
    }

    const playerId = generatePlayerId();
    playerState.pin = pin;
    playerState.playerId = playerId;
    playerState.name = name;
    playerState.score = 0;
    playerState.correctCount = 0;
    playerState.currentQuestion = -1;
    playerState.status = null;
    playerState.answeredQuestions = {};

    await db.ref(`rooms/${pin}/players/${playerId}`).set({
      name: name,
      score: 0,
      correctCount: 0,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    $("player-hud-name").textContent = name;
    $("player-hud-pin").textContent = pin;
    $("player-hud-score").textContent = "0";

    showPlayerView("game");
    subscribePlayerToRoom(pin);
  } catch (err) {
    showJoinError("No se pudo conectar con la sala. Inténtalo de nuevo.");
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = "UNIRSE";
  }
}

function subscribePlayerToRoom(pin) {
  cleanupPlayerListeners();
  playerState.roomRef = db.ref(`rooms/${pin}`);
  playerState.roomRef.on("value", (snap) => {
    const room = snap.val();
    if (!room) {
      showToast("La sala ha sido cerrada.");
      cleanupPlayerListeners();
      showPlayerView("join");
      return;
    }

    const status = room.status || "lobby";
    const qIdx = Number(room.currentQuestion || 0);
    const startedAt = Number(room.questionStartedAt || 0);

    playerState.playersSnapshot = room.players || {};
    const me = playerState.playersSnapshot[playerState.playerId];
    if (me) {
      playerState.score = Number(me.score || 0);
      playerState.correctCount = Number(me.correctCount || 0);
      // Do not spoil the result by updating the HUD score while the question is still active
      if (status !== "question") {
        $("player-hud-score").textContent = String(playerState.score);
      }
    }

    const statusChanged = status !== playerState.status;
    const questionChanged = qIdx !== playerState.currentQuestion;

    playerState.status = status;
    playerState.currentQuestion = qIdx;
    playerState.questionStartedAt = startedAt;

    if (status === "lobby") {
      stopPlayerTimer();
      showPlayerSubstate("lobby");
    } else if (status === "question") {
      // Sync local answered state with Firebase if present
      const remoteAns =
        room.answers &&
        room.answers[qIdx] &&
        room.answers[qIdx][playerState.playerId];
      if (remoteAns && !playerState.answeredQuestions[qIdx]) {
        playerState.answeredQuestions[qIdx] = {
          option: remoteAns.option,
          correct: Boolean(remoteAns.correct),
          points: Number(remoteAns.points || 0)
        };
      }

      if (statusChanged || questionChanged) {
        renderPlayerQuestion(qIdx);
      }
      startPlayerTimer();

      if (playerState.answeredQuestions[qIdx]) {
        renderPlayerWaiting(qIdx, playerState.answeredQuestions[qIdx].option);
        showPlayerSubstate("waiting");
      } else {
        showPlayerSubstate("question");
      }
    } else if (status === "revealed" || status === "reveal" || status === "leaderboard") {
      stopPlayerTimer();
      const remoteAns =
        room.answers &&
        room.answers[qIdx] &&
        room.answers[qIdx][playerState.playerId];
      if (remoteAns && !playerState.answeredQuestions[qIdx]) {
        playerState.answeredQuestions[qIdx] = {
          option: remoteAns.option,
          correct: Boolean(remoteAns.correct),
          points: Number(remoteAns.points || 0)
        };
      }
      renderPlayerFeedback(qIdx);
      showPlayerSubstate("feedback");
    } else if (status === "podium") {
      stopPlayerTimer();
      renderPlayerPodium();
      showPlayerSubstate("podium");
    }
  });
}

function stopPlayerTimer() {
  if (playerState.timerInterval) {
    clearInterval(playerState.timerInterval);
    playerState.timerInterval = null;
  }
}

function startPlayerTimer() {
  if (playerState.timerInterval) return;

  const tick = () => {
    const remaining = computeRemainingSeconds(playerState.questionStartedAt, QUESTION_DURATION);
    const displaySec = Math.ceil(remaining);
    if (displaySec !== playerState.lastDisplayedSec) {
      playerState.lastDisplayedSec = displaySec;
      const secStr = String(displaySec);
      $("player-timer-sec").textContent = secStr;
      $("player-wait-timer-sec").textContent = secStr;
    }
    if (remaining <= 0) {
      lockPlayerOptionButtons();
      stopPlayerTimer();
    }
  };

  tick();
  playerState.timerInterval = setInterval(tick, 200);
}

function renderPlayerQuestion(qIdx) {
  const qData = QUESTIONS[qIdx];
  const existingAnswer = playerState.answeredQuestions[qIdx];

  $("player-q-num").textContent = String(qIdx + 1);
  $("player-wait-q-num").textContent = String(qIdx + 1);
  $("player-question-text").textContent = qData.q;
  playerState.lastDisplayedSec = -1;

  for (let i = 0; i < 4; i++) {
    const btn = $(`player-opt-${i}`);
    $(`player-opt-text-${i}`).textContent = qData.options[i];
    btn.classList.remove("selected");
    btn.disabled = Boolean(existingAnswer);
    if (existingAnswer && existingAnswer.option === i) {
      btn.classList.add("selected");
    }
  }
}

function renderPlayerWaiting(qIdx, optionIndex) {
  $("player-wait-q-num").textContent = String(qIdx + 1);
  const letter = LETTERS[optionIndex] || "-";
  $("player-wait-choice").textContent = `Tu opción: ${letter}`;
}

function lockPlayerOptionButtons() {
  for (let i = 0; i < 4; i++) {
    $(`player-opt-${i}`).disabled = true;
  }
}

async function handlePlayerOptionClick(optionIndex) {
  const qIdx = playerState.currentQuestion;
  if (playerState.status !== "question") return;
  if (playerState.answeredQuestions[qIdx]) return;

  // Lock buttons immediately and switch to calm waiting screen (no spoilers!)
  lockPlayerOptionButtons();
  $(`player-opt-${optionIndex}`).classList.add("selected");
  renderPlayerWaiting(qIdx, optionIndex);
  showPlayerSubstate("waiting");

  const remainingSeconds = computeRemainingSeconds(playerState.questionStartedAt, QUESTION_DURATION);
  const isCorrect = optionIndex === QUESTIONS[qIdx].correct;
  const points = isCorrect
    ? 500 + Math.round((remainingSeconds / 40) * 500)
    : 0;

  // Store locally immediately for instant feedback consistency
  playerState.answeredQuestions[qIdx] = {
    option: optionIndex,
    correct: isCorrect,
    points: points
  };

  // Compute deterministic total score from all answered questions (prevents double counting)
  let totalScore = 0;
  let totalCorrect = 0;
  Object.values(playerState.answeredQuestions).forEach((entry) => {
    totalScore += entry.points;
    if (entry.correct) totalCorrect++;
  });

  playerState.score = totalScore;
  playerState.correctCount = totalCorrect;

  try {
    const updates = {};
    updates[`rooms/${playerState.pin}/answers/${qIdx}/${playerState.playerId}`] = {
      option: optionIndex,
      correct: isCorrect,
      points: points,
      remainingSeconds: Number(remainingSeconds.toFixed(2)),
      answeredAt: firebase.database.ServerValue.TIMESTAMP
    };
    updates[`rooms/${playerState.pin}/players/${playerState.playerId}/score`] = totalScore;
    updates[`rooms/${playerState.pin}/players/${playerState.playerId}/correctCount`] = totalCorrect;

    await db.ref().update(updates);
  } catch (err) {
    showToast("Error al enviar respuesta. Revisa tu conexión.");
  }
}

function getPlayerRankInfo() {
  const sorted = getSortedPlayers(playerState.playersSnapshot);
  const idx = sorted.findIndex((p) => p.id === playerState.playerId);
  return {
    rank: idx >= 0 ? idx + 1 : sorted.length || 1,
    total: sorted.length || 1
  };
}

function renderPlayerFeedback(qIdx) {
  const qData = QUESTIONS[qIdx];
  const answer = playerState.answeredQuestions[qIdx];
  const card = $("player-feedback-card");
  const correctBox = $("player-feedback-correct-box");

  card.classList.remove("is-correct", "is-wrong", "is-timeout");

  if (!answer) {
    card.classList.add("is-timeout");
    $("player-feedback-icon").textContent = "❌";
    $("player-feedback-title").textContent = "TIEMPO AGOTADO";
    $("player-feedback-points").textContent = "+0 puntos";
    correctBox.classList.remove("hidden");
  } else if (answer.correct) {
    card.classList.add("is-correct");
    $("player-feedback-icon").textContent = "✅";
    $("player-feedback-title").textContent = "¡CORRECTO!";
    $("player-feedback-points").textContent = `+${answer.points} puntos`;
    correctBox.classList.add("hidden");
  } else {
    card.classList.add("is-wrong");
    $("player-feedback-icon").textContent = "❌";
    $("player-feedback-title").textContent = "INCORRECTO";
    $("player-feedback-points").textContent = "+0 puntos";
    correctBox.classList.remove("hidden");
  }

  const correctLetter = LETTERS[qData.correct];
  $("player-feedback-correct-answer").textContent =
    `${correctLetter}) ${qData.options[qData.correct]}`;

  const { rank, total } = getPlayerRankInfo();
  $("player-feedback-rank").textContent = `Puesto actual: #${rank} de ${total}`;
  $("player-feedback-total").textContent = `${playerState.score} puntos`;
}

function renderPlayerPodium() {
  const { rank, total } = getPlayerRankInfo();
  $("player-final-rank").textContent = `${rank}.º`;
  $("player-final-score").textContent = `${playerState.score} pts`;
  $("player-final-summary").textContent =
    `Puesto ${rank}.º de ${total} · Respuestas correctas: ${playerState.correctCount} / ${QUESTIONS.length}`;

  if (rank === 1) {
    $("player-final-headline").textContent = "¡Campeón / Campeona del Quiz!";
  } else if (rank <= 3) {
    $("player-final-headline").textContent = "¡Subiste al podio!";
  } else {
    $("player-final-headline").textContent = "¡Gracias por participar!";
  }
}

/* ==========================================================================
   EVENT BINDINGS & URL ?pin=XXXX AUTO-DETECTION
   ========================================================================== */
function bindEvents() {
  // Home
  $("btn-choose-host").addEventListener("click", () => {
    startHostSession();
  });

  $("btn-choose-player").addEventListener("click", () => {
    openPlayerMode("");
  });

  // Host controls
  $("btn-host-exit").addEventListener("click", () => {
    cleanupHostListeners();
    showScreen("home");
  });

  $("btn-host-start").addEventListener("click", () => {
    hostStartQuestion(0);
  });

  $("btn-host-reveal").addEventListener("click", () => {
    hostRevealAnswer();
  });

  $("btn-host-leaderboard").addEventListener("click", () => {
    hostShowLeaderboard();
  });

  $("btn-host-next").addEventListener("click", () => {
    hostAdvance();
  });

  $("btn-lb-next").addEventListener("click", () => {
    hostAdvance();
  });

  $("btn-host-new-game").addEventListener("click", () => {
    startHostSession();
  });

  // Player controls
  $("btn-player-back").addEventListener("click", () => {
    cleanupPlayerListeners();
    // Clear ?pin from URL cleanly if returning home
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showScreen("home");
  });

  $("player-join-form").addEventListener("submit", handlePlayerJoin);

  $("input-pin").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  for (let i = 0; i < 4; i++) {
    $(`player-opt-${i}`).addEventListener("click", () => {
      handlePlayerOptionClick(i);
    });
  }

  $("btn-player-leave").addEventListener("click", () => {
    cleanupPlayerListeners();
    showScreen("home");
  });
}

function initApp() {
  bindEvents();

  // Auto-open player mode if URL has ?pin=XXXX
  const params = new URLSearchParams(window.location.search);
  const pinParam = (params.get("pin") || "").replace(/\D/g, "").slice(0, 4);
  if (pinParam.length > 0) {
    openPlayerMode(pinParam);
  } else {
    showScreen("home");
  }
}

document.addEventListener("DOMContentLoaded", initApp);
