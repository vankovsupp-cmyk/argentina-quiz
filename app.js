/* ==========================================================================
   ClaseQuiz · Shared Real-time Multiplayer Logic (Player PWA & Host PWA)
   Firebase Realtime Database (Compat SDK v10)
   Auto-detects whether loaded in index.html (Player) or host.html (Host)
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

let db = null;
let firebaseInitError = "";

const DEFAULT_DURATION = 40; // seconds
const ADMIN_CODE = "2026";
const LETTERS = ["A", "B", "C", "D"];

/* ==========================================================================
   DEFAULT QUIZ (Seeded into Firebase /quizzes/argentina-default if empty)
   ========================================================================== */
const DEFAULT_QUIZ_ID = "argentina-default";
const DEFAULT_QUIZ = {
  id: DEFAULT_QUIZ_ID,
  title: "Presentación sobre Argentina",
  subtitle: "Geografía, historia, cultura y deporte",
  duration: DEFAULT_DURATION,
  questions: [
    {
      q: "¿Qué significa la palabra latina «argentum»?",
      options: ["Oro", "Agua", "Plata", "Sol"],
      correct: 2
    },
    {
      q: "¿Qué lugar ocupa Argentina entre los países más grandes del mundo?",
      options: ["El segundo lugar", "El octavo lugar", "El quinto lugar", "El décimo lugar"],
      correct: 1
    },
    {
      q: "¿Cómo se llama el barrio de Buenos Aires con casas de colores?",
      options: ["Teatro Colón", "Palermo", "Tucumán", "La Boca"],
      correct: 3
    },
    {
      q: "¿Con cuántos países tiene frontera Argentina?",
      options: ["Con cinco países", "Con tres países", "Con dos países", "Con siete países"],
      correct: 0
    },
    {
      q: "¿Cuál es la montaña más alta de toda América?",
      options: ["El Perito Moreno", "El monte Everest", "El monte Aconcagua", "El Teide"],
      correct: 2
    },
    {
      q: "¿Cómo se llaman los jinetes tradicionales que viven en las Pampas?",
      options: ["Mariachis", "Gauchos", "Matadores", "Mapuches"],
      correct: 1
    },
    {
      q: "¿Cuál es el río más ancho del mundo que está en Argentina?",
      options: ["El río Paraná", "El río Amazonas", "El río Iguazú", "El Río de la Plata"],
      correct: 3
    },
    {
      q: "¿Cuándo es verano en Argentina?",
      options: ["De junio a septiembre", "De octubre a diciembre", "De diciembre a marzo", "De abril a julio"],
      correct: 2
    },
    {
      q: "¿Quién fundó Buenos Aires por segunda vez en 1580?",
      options: ["Juan de Garay", "Pedro de Mendoza", "José de San Martín", "Raúl Alfonsín"],
      correct: 0
    },
    {
      q: "¿Qué día declaró Argentina su independencia de España?",
      options: ["El 25 de mayo de 1810", "El 9 de julio de 1816", "El 12 de octubre de 1492", "El 1 de enero de 1983"],
      correct: 1
    },
    {
      q: "¿Qué general cruzó los Andes para liberar Argentina, Chile y Perú?",
      options: ["Juan Domingo Perón", "Carlos Gardel", "Raúl Alfonsín", "José de San Martín"],
      correct: 3
    },
    {
      q: "¿En qué años ganó Argentina sus tres Copas del Mundo de fútbol?",
      options: ["En 1930, 1950 y 2014", "En 1982, 1990 y 2018", "En 1978, 1986 y 2022", "En 1966, 1998 y 2010"],
      correct: 2
    },
    {
      q: "¿Cómo se llama el partido de fútbol entre Boca Juniors y River Plate?",
      options: ["La Albiceleste", "El Superclásico", "El Mundial", "La Copa"],
      correct: 1
    },
    {
      q: "¿Qué instrumento musical especial se toca en el tango?",
      options: ["El bandoneón", "La guitarra eléctrica", "La trompeta", "El piano"],
      correct: 0
    },
    {
      q: "¿En qué isla está Ushuaia, la ciudad llamada «El fin del mundo»?",
      options: ["En la Patagonia", "En las Pampas", "En Tucumán", "En Tierra del Fuego"],
      correct: 3
    }
  ]
};

/* ==========================================================================
   SHARED UTILITIES & SAFE FIREBASE INITIALIZATION
   ========================================================================== */
const $ = (id) => document.getElementById(id);

let serverTimeOffset = 0;

function serverNow() {
  return Date.now() + serverTimeOffset;
}

function initFirebase() {
  try {
    if (typeof firebase === "undefined" || typeof firebase.initializeApp !== "function") {
      throw new Error("No se pudieron cargar las librerías de Firebase (revisa la conexión a Internet o el bloqueador de contenido).");
    }
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
    if (typeof firebase.database !== "function") {
      throw new Error("El módulo Firebase Realtime Database no está disponible.");
    }
    db = firebase.database();
    firebaseInitError = "";

    db.ref(".info/serverTimeOffset").on(
      "value",
      (snap) => {
        serverTimeOffset = snap.val() || 0;
      },
      () => {
        // Ignore offset error gracefully; fall back to local clock
      }
    );
    return true;
  } catch (err) {
    db = null;
    firebaseInitError = err && err.message ? err.message : "Error de conexión con Firebase.";
    return false;
  }
}

function registerServiceWorker() {
  try {
    if (
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.protocol === "http:")
    ) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Non-blocking PWA SW registration
      });
    }
  } catch (err) {
    // Ignore SW errors gracefully
  }
}

let toastTimer = null;
function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 3200);
}

function showFatalError(title, detail) {
  const hostScreen = $("screen-host");
  const playerScreen = $("screen-player");
  if (hostScreen) hostScreen.classList.remove("active");
  if (playerScreen) playerScreen.classList.remove("active");

  const banner = $("app-error-banner");
  if (banner) {
    const titleEl = $("app-error-title");
    const detailEl = $("app-error-detail");
    if (titleEl) titleEl.textContent = title || "Error al cargar la aplicación";
    if (detailEl) detailEl.textContent = detail || "Intenta recargar la página.";
    banner.classList.remove("hidden");
  }
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generatePlayerId() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function generateQuizId() {
  return "quiz_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
}

/**
 * ALWAYS builds the student app URL (index.html?pin=XXXX), preserving GitHub Pages
 * subfolder (/argentina-quiz/) and NEVER pointing to host.html.
 */
function buildStudentJoinUrl(currentPin) {
  const cleanHref = window.location.href.split("?")[0].split("#")[0];
  const baseDir = cleanHref.substring(0, cleanHref.lastIndexOf("/") + 1);
  return baseDir + "index.html?pin=" + encodeURIComponent(currentPin);
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

function computeRemainingSeconds(startedAt, duration = DEFAULT_DURATION) {
  if (!startedAt) return duration;
  const elapsed = (serverNow() - startedAt) / 1000;
  return Math.max(0, Math.min(duration, duration - elapsed));
}

function normalizeQuizObject(id, raw) {
  if (!raw || typeof raw !== "object") return null;
  const rawQuestions = Array.isArray(raw.questions)
    ? raw.questions
    : raw.questions && typeof raw.questions === "object"
      ? Object.values(raw.questions)
      : [];

  const questions = rawQuestions
    .filter((item) => item && item.q && item.options)
    .map((item) => {
      const opts = Array.isArray(item.options) ? item.options : Object.values(item.options);
      return {
        q: String(item.q),
        options: [
          String(opts[0] || ""),
          String(opts[1] || ""),
          String(opts[2] || ""),
          String(opts[3] || "")
        ],
        correct: Math.max(0, Math.min(3, Number(item.correct) || 0))
      };
    });

  if (questions.length === 0) return null;

  return {
    id: id || raw.id || DEFAULT_QUIZ_ID,
    title: String(raw.title || "Quiz sin título"),
    subtitle: String(raw.subtitle || ""),
    duration: Math.max(10, Math.min(120, Number(raw.duration) || DEFAULT_DURATION)),
    questions: questions
  };
}

function readPinFromUrl() {
  try {
    if (typeof URLSearchParams === "function") {
      const params = new URLSearchParams(window.location.search);
      return (params.get("pin") || "").replace(/\D/g, "").slice(0, 4);
    }
  } catch (err) {
    // Fall through to regex fallback
  }
  try {
    const match = (window.location.search || "").match(/[?&]pin=([^&]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).replace(/\D/g, "").slice(0, 4);
    }
  } catch (err) {
    return "";
  }
  return "";
}

/* ==========================================================================
   APP MODE 1: HOST PWA (host.html)
   ========================================================================== */
let hostViews = {};

const hostState = {
  quizzes: {}, // { [quizId]: normalizedQuiz }
  selectedQuiz: DEFAULT_QUIZ,
  editingQuizId: null,
  adminUnlocked: false,
  pin: null,
  directJoinUrl: "",
  copyResetTimer: null,
  status: null,
  currentQuestion: 0,
  questionDuration: DEFAULT_DURATION,
  questionStartedAt: 0,
  players: {},
  answersForCurrent: {},
  timerInterval: null,
  quizzesRef: null,
  roomRef: null,
  playersRef: null,
  answersRef: null,
  lastDisplayedSec: -1
};

function showHostView(name) {
  Object.keys(hostViews).forEach((key) => {
    if (hostViews[key]) {
      hostViews[key].classList.toggle("active", key === name);
    }
  });

  const inSession = name === "lobby" || name === "question" || name === "leaderboard" || name === "podium";
  const exitBtn = $("btn-host-exit");
  const topMeta = $("host-topbar-meta");
  const selectActions = $("host-topbar-select-actions");
  const topTitle = $("host-topbar-title");

  if (exitBtn) exitBtn.classList.toggle("hidden", !inSession);
  if (topMeta) topMeta.classList.toggle("hidden", !inSession);
  if (selectActions) selectActions.classList.toggle("hidden", name !== "select");
  if (topTitle) {
    topTitle.textContent = inSession && hostState.selectedQuiz
      ? hostState.selectedQuiz.title
      : "ClaseQuiz Host";
  }
}

function cleanupHostRoomListeners() {
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

async function initHostQuizCatalog() {
  if (!db) return;

  try {
    const snap = await db.ref("quizzes").once("value");
    if (!snap.exists() || !snap.val()) {
      // Seed default Argentina quiz into Firebase /quizzes
      await db.ref(`quizzes/${DEFAULT_QUIZ_ID}`).set({
        title: DEFAULT_QUIZ.title,
        subtitle: DEFAULT_QUIZ.subtitle,
        duration: DEFAULT_QUIZ.duration,
        questions: DEFAULT_QUIZ.questions,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    }
  } catch (err) {
    // Even if seeding fails due to network hiccup, still show built-in default quiz
    hostState.quizzes[DEFAULT_QUIZ_ID] = DEFAULT_QUIZ;
    renderHostQuizCatalog();
  }

  hostState.quizzesRef = db.ref("quizzes");
  hostState.quizzesRef.on(
    "value",
    (snap) => {
      const raw = snap.val() || {};
      const parsed = {};
      Object.entries(raw).forEach(([id, val]) => {
        const normalized = normalizeQuizObject(id, val);
        if (normalized) parsed[id] = normalized;
      });

      if (Object.keys(parsed).length === 0) {
        parsed[DEFAULT_QUIZ_ID] = DEFAULT_QUIZ;
      }

      hostState.quizzes = parsed;
      renderHostQuizCatalog();
      renderManagerQuizzesList();
    },
    () => {
      hostState.quizzes[DEFAULT_QUIZ_ID] = DEFAULT_QUIZ;
      renderHostQuizCatalog();
    }
  );
}

function renderHostQuizCatalog() {
  const grid = $("host-quizzes-grid");
  const loading = $("host-quizzes-loading");
  if (!grid) return;

  if (loading) loading.classList.add("hidden");
  grid.innerHTML = "";

  const quizzes = Object.values(hostState.quizzes);
  quizzes.forEach((quiz) => {
    const card = document.createElement("article");
    card.className = "card quiz-catalog-card";

    const pills = document.createElement("div");
    pills.className = "quiz-card-pills";

    const qPill = document.createElement("span");
    qPill.className = "quiz-pill tabular";
    qPill.textContent = `${quiz.questions.length} preguntas`;

    const tPill = document.createElement("span");
    tPill.className = "quiz-pill gold tabular";
    tPill.textContent = `${quiz.duration} s / pregunta`;

    pills.append(qPill, tPill);

    const title = document.createElement("h2");
    title.className = "quiz-card-title";
    title.textContent = quiz.title;

    const desc = document.createElement("p");
    desc.className = "quiz-card-desc";
    desc.textContent = quiz.subtitle || "Quiz interactivo multijugador";

    const actions = document.createElement("div");
    actions.className = "quiz-card-actions";

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "btn-primary btn-block btn-lg";
    startBtn.textContent = "Iniciar Sala →";
    startBtn.addEventListener("click", () => {
      startHostSession(quiz);
    });

    actions.appendChild(startBtn);
    card.append(pills, title, desc, actions);
    grid.appendChild(card);
  });
}

/* ---------- Admin Code Modal & Quiz Manager (/quizzes) ---------- */
function openAdminModal() {
  if (hostState.adminUnlocked) {
    openQuizManager();
    return;
  }
  const modal = $("modal-admin-code");
  const input = $("input-admin-code");
  const errEl = $("admin-code-error");
  if (errEl) {
    errEl.textContent = "";
    errEl.classList.add("hidden");
  }
  if (input) input.value = "";
  if (modal) modal.classList.remove("hidden");
  setTimeout(() => {
    if (input) input.focus();
  }, 50);
}

function closeAdminModal() {
  const modal = $("modal-admin-code");
  if (modal) modal.classList.add("hidden");
}

function handleAdminCodeSubmit(e) {
  e.preventDefault();
  const input = $("input-admin-code");
  const errEl = $("admin-code-error");
  const code = (input ? input.value : "").trim();

  if (code === ADMIN_CODE) {
    hostState.adminUnlocked = true;
    closeAdminModal();
    openQuizManager();
  } else {
    if (errEl) {
      errEl.textContent = "Código incorrecto. Inténtalo de nuevo.";
      errEl.classList.remove("hidden");
    }
    if (input) {
      input.value = "";
      input.focus();
    }
  }
}

function openQuizManager() {
  $("manager-list-panel").classList.remove("hidden");
  $("manager-editor-panel").classList.add("hidden");
  renderManagerQuizzesList();
  showHostView("manager");
}

function renderManagerQuizzesList() {
  const container = $("manager-quizzes-list");
  if (!container) return;
  container.innerHTML = "";

  const quizzes = Object.values(hostState.quizzes);
  if (quizzes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "players-empty";
    empty.textContent = "No hay quizzes todavía. Crea uno nuevo.";
    container.appendChild(empty);
    return;
  }

  quizzes.forEach((quiz) => {
    const card = document.createElement("div");
    card.className = "card manager-item-card";

    const info = document.createElement("div");
    info.className = "manager-item-info";

    const title = document.createElement("h3");
    title.className = "manager-item-title";
    title.textContent = quiz.title;

    const meta = document.createElement("p");
    meta.className = "manager-item-meta";
    meta.textContent = `${quiz.questions.length} preguntas · ${quiz.duration} s${quiz.subtitle ? " · " + quiz.subtitle : ""}`;

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "action-group";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "btn-gold btn-sm";
    playBtn.textContent = "Jugar";
    playBtn.addEventListener("click", () => startHostSession(quiz));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-primary btn-sm";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => openQuizEditor(quiz));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-danger btn-sm";
    delBtn.textContent = "Eliminar";
    delBtn.addEventListener("click", () => deleteQuizFromFirebase(quiz));

    actions.append(playBtn, editBtn, delBtn);
    card.append(info, actions);
    container.appendChild(card);
  });
}

function createEditorQuestionCard(qData = null, idx = 0) {
  const card = document.createElement("div");
  card.className = "editor-q-card";
  const radioName = "correct_q_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);

  const top = document.createElement("div");
  top.className = "editor-q-top";

  const badge = document.createElement("span");
  badge.className = "editor-q-badge";
  badge.textContent = `Pregunta ${idx + 1}`;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-danger btn-sm";
  removeBtn.textContent = "Quitar";
  removeBtn.addEventListener("click", () => {
    card.remove();
    renumberEditorQuestions();
  });

  top.append(badge, removeBtn);

  const qInput = document.createElement("input");
  qInput.type = "text";
  qInput.className = "input-field editor-q-input";
  qInput.placeholder = "Escribe el enunciado de la pregunta...";
  qInput.value = qData ? qData.q : "";
  qInput.required = true;

  const optsGrid = document.createElement("div");
  optsGrid.className = "editor-options-grid";

  const selectedCorrect = qData && typeof qData.correct === "number" ? qData.correct : 0;

  for (let i = 0; i < 4; i++) {
    const row = document.createElement("div");
    row.className = "editor-opt-row";

    const label = document.createElement("label");
    label.className = "editor-opt-radio";
    label.title = `Marcar ${LETTERS[i]} como correcta`;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = radioName;
    radio.value = String(i);
    radio.checked = i === selectedCorrect;

    const letterSpan = document.createElement("span");
    letterSpan.textContent = LETTERS[i];

    label.append(radio, letterSpan);

    const optInput = document.createElement("input");
    optInput.type = "text";
    optInput.className = "input-field editor-opt-input";
    optInput.placeholder = `Opción ${LETTERS[i]}`;
    optInput.value = qData && qData.options && qData.options[i] ? qData.options[i] : "";
    optInput.required = true;

    row.append(label, optInput);
    optsGrid.appendChild(row);
  }

  card.append(top, qInput, optsGrid);
  return card;
}

function renumberEditorQuestions() {
  const list = $("editor-questions-list");
  if (!list) return;
  const cards = Array.from(list.children);
  cards.forEach((card, i) => {
    const badge = card.querySelector(".editor-q-badge");
    if (badge) badge.textContent = `Pregunta ${i + 1}`;
  });
  const countEl = $("editor-q-count");
  if (countEl) countEl.textContent = String(cards.length);
}

function openQuizEditor(quiz = null) {
  hostState.editingQuizId = quiz ? quiz.id : null;
  $("editor-heading").textContent = quiz ? "Editar Quiz" : "Crear Nuevo Quiz";
  $("editor-title").value = quiz ? quiz.title : "";
  $("editor-subtitle").value = quiz ? quiz.subtitle : "";
  $("editor-duration").value = String(quiz ? quiz.duration : DEFAULT_DURATION);

  const errEl = $("editor-error");
  errEl.textContent = "";
  errEl.classList.add("hidden");

  const list = $("editor-questions-list");
  list.innerHTML = "";

  if (quiz && quiz.questions && quiz.questions.length > 0) {
    quiz.questions.forEach((q, idx) => {
      list.appendChild(createEditorQuestionCard(q, idx));
    });
  } else {
    list.appendChild(createEditorQuestionCard(null, 0));
  }
  renumberEditorQuestions();

  $("manager-list-panel").classList.add("hidden");
  $("manager-editor-panel").classList.remove("hidden");
  $("editor-title").focus();
}

function showEditorError(msg) {
  const el = $("editor-error");
  if (!el) return;
  if (!msg) {
    el.textContent = "";
    el.classList.add("hidden");
  } else {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

async function handleQuizEditorSave(e) {
  e.preventDefault();
  showEditorError("");

  if (!db) {
    showEditorError("No hay conexión con Firebase.");
    return;
  }

  const title = $("editor-title").value.trim();
  const subtitle = $("editor-subtitle").value.trim();
  const duration = Math.max(10, Math.min(120, Number($("editor-duration").value) || DEFAULT_DURATION));

  if (!title) {
    showEditorError("Introduce un título para el quiz.");
    $("editor-title").focus();
    return;
  }

  const cards = Array.from($("editor-questions-list").children);
  if (cards.length === 0) {
    showEditorError("Añade al menos una pregunta.");
    return;
  }

  const questions = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const qText = card.querySelector(".editor-q-input").value.trim();
    const optInputs = Array.from(card.querySelectorAll(".editor-opt-input"));
    const options = optInputs.map((inp) => inp.value.trim());
    const checkedRadio = card.querySelector('input[type="radio"]:checked');
    const correct = checkedRadio ? Number(checkedRadio.value) : 0;

    if (!qText) {
      showEditorError(`La pregunta ${i + 1} no tiene enunciado.`);
      card.querySelector(".editor-q-input").focus();
      return;
    }
    if (options.some((opt) => !opt)) {
      showEditorError(`Completa las 4 opciones (A, B, C, D) en la pregunta ${i + 1}.`);
      return;
    }

    questions.push({ q: qText, options, correct });
  }

  const quizId = hostState.editingQuizId || generateQuizId();
  const saveBtns = [$("btn-editor-save"), $("btn-editor-save-bottom")];
  saveBtns.forEach((b) => { if (b) b.disabled = true; });

  try {
    await db.ref(`quizzes/${quizId}`).set({
      title,
      subtitle,
      duration,
      questions,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    showToast("Quiz guardado en Firebase ✓");
    openQuizManager();
  } catch (err) {
    showEditorError("Error al guardar en Firebase. Revisa tu conexión.");
  } finally {
    saveBtns.forEach((b) => { if (b) b.disabled = false; });
  }
}

async function deleteQuizFromFirebase(quiz) {
  if (!db) return;
  const total = Object.keys(hostState.quizzes).length;
  if (total <= 1) {
    showToast("Debe haber al menos un quiz disponible.");
    return;
  }
  const confirmed = window.confirm(`¿Eliminar el quiz "${quiz.title}"?`);
  if (!confirmed) return;

  try {
    await db.ref(`quizzes/${quiz.id}`).remove();
    showToast("Quiz eliminado.");
  } catch (err) {
    showToast("No se pudo eliminar el quiz.");
  }
}

/* ---------- Host Live Room & Gameplay ---------- */
async function startHostSession(quiz) {
  if (!db) {
    showFatalError("Sin conexión con Firebase", firebaseInitError || "No se pudo conectar con la base de datos.");
    return;
  }

  const activeQuiz = quiz || hostState.selectedQuiz || DEFAULT_QUIZ;
  hostState.selectedQuiz = activeQuiz;
  hostState.questionDuration = activeQuiz.duration || DEFAULT_DURATION;

  cleanupHostRoomListeners();
  showHostView("lobby");

  $("host-players-list").innerHTML = "";
  $("host-players-empty").classList.remove("hidden");
  $("host-lobby-count").textContent = "0";
  $("host-topbar-players").textContent = "0";

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

  $("host-topbar-pin").textContent = pin;
  $("host-lobby-pin").textContent = pin;

  // ALWAYS point QR code, visible URL, and Copy button to index.html?pin=XXXX (Student App)
  const studentUrl = buildStudentJoinUrl(pin);
  hostState.directJoinUrl = studentUrl;

  $("host-direct-url").textContent = studentUrl;
  $("host-qr-img").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" +
    encodeURIComponent(studentUrl);

  clearTimeout(hostState.copyResetTimer);
  $("btn-copy-link").classList.remove("copied");
  $("copy-link-icon").classList.remove("hidden");
  $("copy-link-label").textContent = "Copiar enlace directo";

  hostState.roomRef = db.ref(`rooms/${pin}`);
  await hostState.roomRef.set({
    status: "lobby",
    quizId: activeQuiz.id || DEFAULT_QUIZ_ID,
    quizTitle: activeQuiz.title,
    questions: activeQuiz.questions,
    currentQuestion: 0,
    questionDuration: hostState.questionDuration,
    questionStartedAt: 0,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  });

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

  $("host-topbar-players").textContent = countStr;
  $("host-lobby-count").textContent = countStr;
  emptyEl.classList.toggle("hidden", ids.length > 0);

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

  // Auto-finish question immediately when 100% of active players have answered
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
    updateHostResponseCounter();

    if (hostState.status === "revealed") {
      updateHostRevealPercentages();
    }
  });
}

function loadHostQuestionDOM(questionIndex) {
  const questions = hostState.selectedQuiz.questions;
  const qData = questions[questionIndex];

  $("host-q-num").textContent = String(questionIndex + 1);
  $("host-q-total").textContent = String(questions.length);
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

  const isLast = questionIndex >= questions.length - 1;
  $("btn-host-next").textContent = isLast ? "Ver Podio Final →" : "Siguiente Pregunta →";
  $("btn-lb-next").textContent = isLast ? "Ver Podio Final →" : "Siguiente Pregunta →";
}

async function hostStartQuestion(questionIndex) {
  if (hostState.timerInterval) {
    clearInterval(hostState.timerInterval);
    hostState.timerInterval = null;
  }

  const duration = hostState.questionDuration || DEFAULT_DURATION;
  hostState.status = "question";
  hostState.currentQuestion = questionIndex;
  hostState.lastDisplayedSec = duration;

  loadHostQuestionDOM(questionIndex);
  showHostView("question");
  attachHostAnswersListener(questionIndex);

  $("host-timer-sec").textContent = String(duration);
  $("host-timer-bar").style.width = "100%";
  $("host-timer-pill").classList.remove("warning", "ended");

  hostState.questionStartedAt = serverNow();

  await hostState.roomRef.update({
    status: "question",
    currentQuestion: questionIndex,
    questionStartedAt: firebase.database.ServerValue.TIMESTAMP,
    questionDuration: duration
  });

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

    const remaining = computeRemainingSeconds(hostState.questionStartedAt, duration);
    const displaySec = Math.ceil(remaining);

    if (displaySec !== hostState.lastDisplayedSec) {
      hostState.lastDisplayedSec = displaySec;
      $("host-timer-sec").textContent = String(displaySec);
    }

    const pct = Math.max(0, Math.min(100, (remaining / duration) * 100));
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

  const correctIdx = hostState.selectedQuiz.questions[hostState.currentQuestion].correct;
  const grid = $("host-options-grid");
  grid.classList.add("revealed");

  for (let i = 0; i < 4; i++) {
    const card = $(`host-opt-${i}`);
    card.classList.toggle("is-correct", i === correctIdx);
    card.classList.toggle("is-dimmed", i !== correctIdx);
  }

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
  $("host-lb-q-total").textContent = String(hostState.selectedQuiz.questions.length);
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
  const eyebrow = $("podium-quiz-eyebrow");
  if (eyebrow) {
    eyebrow.textContent = `RESULTADOS FINALES · ${hostState.selectedQuiz.title.toUpperCase()}`;
  }

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
  if (nextIndex < hostState.selectedQuiz.questions.length) {
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

async function copyDirectJoinLink() {
  const url = hostState.directJoinUrl || (hostState.pin ? buildStudentJoinUrl(hostState.pin) : "");
  if (!url) return;

  let copied = false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch (err) {
      copied = false;
    }
  }

  if (!copied) {
    const temp = document.createElement("textarea");
    temp.value = url;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
      copied = true;
    } catch (err) {
      copied = false;
    }
    temp.remove();
  }

  if (copied) {
    const btn = $("btn-copy-link");
    const icon = $("copy-link-icon");
    const label = $("copy-link-label");

    btn.classList.add("copied");
    icon.classList.add("hidden");
    label.textContent = "¡Enlace copiado! ✓";

    clearTimeout(hostState.copyResetTimer);
    hostState.copyResetTimer = setTimeout(() => {
      btn.classList.remove("copied");
      icon.classList.remove("hidden");
      label.textContent = "Copiar enlace directo";
    }, 2000);
  } else {
    showToast("No se pudo copiar automáticamente el enlace.");
  }
}

function initHostApp() {
  hostViews = {
    select: $("host-view-select"),
    manager: $("host-view-manager"),
    lobby: $("host-view-lobby"),
    question: $("host-view-question"),
    leaderboard: $("host-view-leaderboard"),
    podium: $("host-view-podium")
  };

  // Topbar & navigation
  $("btn-host-exit").addEventListener("click", () => {
    cleanupHostRoomListeners();
    showHostView("select");
  });

  $("btn-open-manager").addEventListener("click", openAdminModal);
  $("btn-admin-cancel").addEventListener("click", closeAdminModal);
  $("admin-code-form").addEventListener("submit", handleAdminCodeSubmit);
  $("modal-admin-code").addEventListener("click", (e) => {
    if (e.target === $("modal-admin-code")) closeAdminModal();
  });

  // Manager & Editor controls
  $("btn-manager-back").addEventListener("click", () => showHostView("select"));
  $("btn-new-quiz").addEventListener("click", () => openQuizEditor(null));
  $("btn-editor-cancel").addEventListener("click", () => openQuizManager());
  $("quiz-editor-form").addEventListener("submit", handleQuizEditorSave);

  const addQuestionHandler = () => {
    const list = $("editor-questions-list");
    const card = createEditorQuestionCard(null, list.children.length);
    list.appendChild(card);
    renumberEditorQuestions();
    const inp = card.querySelector(".editor-q-input");
    if (inp) inp.focus();
  };
  $("btn-add-question").addEventListener("click", addQuestionHandler);
  $("btn-add-question-bottom").addEventListener("click", addQuestionHandler);

  // Lobby & Gameplay controls
  $("btn-copy-link").addEventListener("click", copyDirectJoinLink);
  $("btn-host-start").addEventListener("click", () => hostStartQuestion(0));
  $("btn-host-reveal").addEventListener("click", () => hostRevealAnswer());
  $("btn-host-leaderboard").addEventListener("click", () => hostShowLeaderboard());
  $("btn-host-next").addEventListener("click", () => hostAdvance());
  $("btn-lb-next").addEventListener("click", () => hostAdvance());
  $("btn-host-new-game").addEventListener("click", () => startHostSession(hostState.selectedQuiz));
  $("btn-host-back-select").addEventListener("click", () => {
    cleanupHostRoomListeners();
    showHostView("select");
  });

  showHostView("select");
  initHostQuizCatalog();
}

/* ==========================================================================
   APP MODE 2: PLAYER PWA (index.html)
   ========================================================================== */
let playerViews = {};
let playerSubstates = {};

const playerState = {
  lockedPin: "",
  pin: null,
  playerId: null,
  name: "",
  quizTitle: DEFAULT_QUIZ.title,
  questions: DEFAULT_QUIZ.questions,
  questionDuration: DEFAULT_DURATION,
  score: 0,
  correctCount: 0,
  currentQuestion: -1,
  status: null,
  questionStartedAt: 0,
  answeredQuestions: {},
  playersSnapshot: {},
  roomRef: null,
  timerInterval: null,
  lastDisplayedSec: -1
};

function showPlayerView(name) {
  Object.keys(playerViews).forEach((key) => {
    if (playerViews[key]) {
      playerViews[key].classList.toggle("active", key === name);
    }
  });
}

function showPlayerSubstate(name) {
  Object.keys(playerSubstates).forEach((key) => {
    if (playerSubstates[key]) {
      playerSubstates[key].classList.toggle("active", key === name);
    }
  });
}

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
  if (!el) return;
  if (!msg) {
    el.classList.add("hidden");
    el.textContent = "";
  } else {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function openPlayerJoinView(prefillPin = "") {
  cleanupPlayerListeners();
  showPlayerView("join");
  showJoinError("");

  const pinInput = $("input-pin");
  const nameInput = $("input-name");
  const pinGroup = $("player-pin-group");
  const roomBadge = $("player-room-badge");
  const roomBadgePin = $("player-room-badge-pin");

  const cleanPin = (prefillPin || "").replace(/\D/g, "").slice(0, 4);

  if (cleanPin.length > 0) {
    // Locked direct link (?pin=XXXX): show "Sala #XXXX", hide PIN input, focus Name
    playerState.lockedPin = cleanPin;
    pinInput.value = cleanPin;
    pinInput.readOnly = true;
    roomBadgePin.textContent = `#${cleanPin}`;
    roomBadge.classList.remove("hidden");
    pinGroup.classList.add("hidden");
    setTimeout(() => nameInput.focus(), 50);
  } else {
    // Opened from phone home screen icon without ?pin=: show PIN + Name fields
    playerState.lockedPin = "";
    pinInput.value = "";
    pinInput.readOnly = false;
    roomBadge.classList.add("hidden");
    pinGroup.classList.remove("hidden");
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
    if (!playerState.lockedPin) $("input-pin").focus();
    return;
  }
  if (name.length < 1) {
    showJoinError("Escribe tu nombre para entrar.");
    $("input-name").focus();
    return;
  }

  if (!db) {
    showJoinError(firebaseInitError || "No hay conexión con Firebase. Recarga la página e inténtalo de nuevo.");
    return;
  }

  const joinBtn = $("btn-player-join");
  joinBtn.disabled = true;
  joinBtn.textContent = "Conectando...";

  try {
    const roomSnap = await db.ref(`rooms/${pin}`).once("value");
    if (!roomSnap.exists()) {
      showJoinError(`No se encontró ninguna sala activa con el PIN ${pin}.`);
      joinBtn.disabled = false;
      joinBtn.textContent = "Entrar";
      return;
    }

    const roomData = roomSnap.val() || {};
    const parsedQuiz = normalizeQuizObject(roomData.quizId || DEFAULT_QUIZ_ID, {
      title: roomData.quizTitle || DEFAULT_QUIZ.title,
      duration: roomData.questionDuration || DEFAULT_DURATION,
      questions: roomData.questions || DEFAULT_QUIZ.questions
    });

    const playerId = generatePlayerId();
    playerState.pin = pin;
    playerState.playerId = playerId;
    playerState.name = name;
    playerState.quizTitle = parsedQuiz ? parsedQuiz.title : DEFAULT_QUIZ.title;
    playerState.questions = parsedQuiz ? parsedQuiz.questions : DEFAULT_QUIZ.questions;
    playerState.questionDuration = parsedQuiz ? parsedQuiz.duration : DEFAULT_DURATION;
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
    $("player-lobby-quiz-title").textContent = playerState.quizTitle;

    showPlayerView("game");
    subscribePlayerToRoom(pin);
  } catch (err) {
    showJoinError("No se pudo conectar con la sala. Inténtalo de nuevo.");
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = "Entrar";
  }
}

function subscribePlayerToRoom(pin) {
  cleanupPlayerListeners();
  playerState.roomRef = db.ref(`rooms/${pin}`);
  playerState.roomRef.on("value", (snap) => {
    const room = snap.val();
    if (!room) {
      showToast("La sala ha sido cerrada.");
      openPlayerJoinView(playerState.lockedPin);
      return;
    }

    if (room.quizTitle) {
      playerState.quizTitle = room.quizTitle;
      $("player-lobby-quiz-title").textContent = room.quizTitle;
    }
    if (room.questions) {
      const normalized = normalizeQuizObject(room.quizId || DEFAULT_QUIZ_ID, {
        title: room.quizTitle || playerState.quizTitle,
        duration: room.questionDuration || DEFAULT_DURATION,
        questions: room.questions
      });
      if (normalized) {
        playerState.questions = normalized.questions;
        playerState.questionDuration = normalized.duration;
      }
    } else if (room.questionDuration) {
      playerState.questionDuration = Number(room.questionDuration) || DEFAULT_DURATION;
    }

    const status = room.status || "lobby";
    const qIdx = Number(room.currentQuestion || 0);
    const startedAt = Number(room.questionStartedAt || 0);

    playerState.playersSnapshot = room.players || {};
    const me = playerState.playersSnapshot[playerState.playerId];
    if (me) {
      playerState.score = Number(me.score || 0);
      playerState.correctCount = Number(me.correctCount || 0);
      // Never spoil the result while the question is still active
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
    const duration = playerState.questionDuration || DEFAULT_DURATION;
    const remaining = computeRemainingSeconds(playerState.questionStartedAt, duration);
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
  const qData = playerState.questions[qIdx];
  if (!qData) return;

  const existingAnswer = playerState.answeredQuestions[qIdx];
  const totalStr = String(playerState.questions.length);

  $("player-q-num").textContent = String(qIdx + 1);
  $("player-q-total").textContent = totalStr;
  $("player-wait-q-num").textContent = String(qIdx + 1);
  $("player-wait-q-total").textContent = totalStr;
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
  $("player-wait-q-total").textContent = String(playerState.questions.length);
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
  const qData = playerState.questions[qIdx];
  if (playerState.status !== "question" || !qData) return;
  if (playerState.answeredQuestions[qIdx]) return;

  // Lock buttons immediately and show calm waiting screen (no spoilers)
  lockPlayerOptionButtons();
  $(`player-opt-${optionIndex}`).classList.add("selected");
  renderPlayerWaiting(qIdx, optionIndex);
  showPlayerSubstate("waiting");

  const duration = playerState.questionDuration || DEFAULT_DURATION;
  const remainingSeconds = computeRemainingSeconds(playerState.questionStartedAt, duration);
  const isCorrect = optionIndex === qData.correct;
  const points = isCorrect
    ? 500 + Math.round((remainingSeconds / duration) * 500)
    : 0;

  playerState.answeredQuestions[qIdx] = {
    option: optionIndex,
    correct: isCorrect,
    points: points
  };

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
  const qData = playerState.questions[qIdx];
  if (!qData) return;

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
    `Puesto ${rank}.º de ${total} · Respuestas correctas: ${playerState.correctCount} / ${playerState.questions.length}`;

  if (rank === 1) {
    $("player-final-headline").textContent = "¡Campeón / Campeona del Quiz!";
  } else if (rank <= 3) {
    $("player-final-headline").textContent = "¡Subiste al podio!";
  } else {
    $("player-final-headline").textContent = "¡Gracias por participar!";
  }
}

function initPlayerApp() {
  playerViews = {
    join: $("player-view-join"),
    game: $("player-view-game")
  };

  playerSubstates = {
    lobby: $("player-state-lobby"),
    question: $("player-state-question"),
    waiting: $("player-state-waiting"),
    feedback: $("player-state-feedback"),
    podium: $("player-state-podium")
  };

  $("player-join-form").addEventListener("submit", handlePlayerJoin);

  $("input-pin").addEventListener("input", (e) => {
    if (playerState.lockedPin) return;
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  for (let i = 0; i < 4; i++) {
    $(`player-opt-${i}`).addEventListener("click", () => {
      handlePlayerOptionClick(i);
    });
  }

  $("btn-player-leave").addEventListener("click", () => {
    // In standalone Player App, return cleanly to join screen (clear ?pin if user wants a new room)
    try {
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.href.split("?")[0].split("#")[0];
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (err) {
      // Ignore history API restrictions
    }
    openPlayerJoinView("");
  });

  const pinParam = readPinFromUrl();
  openPlayerJoinView(pinParam);
}

/* ==========================================================================
   ENTRY POINT: AUTO-DETECT PLAYER APP (index.html) vs HOST APP (host.html)
   ========================================================================== */
function detectAppMode() {
  const attr = document.body && document.body.dataset ? document.body.dataset.appMode : "";
  if (attr === "host" || attr === "player") return attr;
  if ($("screen-host") && !$("screen-player")) return "host";
  return "player";
}

function initApp() {
  try {
    registerServiceWorker();

    const firebaseReady = initFirebase();
    if (!firebaseReady) {
      showFatalError(
        "No se pudo conectar con Firebase",
        firebaseInitError || "Comprueba tu conexión a Internet y vuelve a intentarlo."
      );
      return;
    }

    const mode = detectAppMode();
    if (mode === "host") {
      initHostApp();
    } else {
      initPlayerApp();
    }
  } catch (err) {
    showFatalError(
      "Error al iniciar la aplicación",
      err && err.message ? err.message : "Ocurrió un error inesperado. Por favor, recarga la página."
    );
  }
}

document.addEventListener("DOMContentLoaded", initApp);
