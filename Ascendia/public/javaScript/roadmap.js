/* ══════════════════════════════════════════════════════
   ASCENDIA — roadmap.js
   Logique complète : rendu dynamique + gamification + QCM
══════════════════════════════════════════════════════ */

/* ── Starfield (identique à l'original) ── */
const cv = document.getElementById("cv"),
  ctx = cv.getContext("2d");
let W,
  H,
  stars = [];
function resize() {
  W = cv.width = window.innerWidth;
  H = cv.height = window.innerHeight;
}
function initS() {
  stars = [];
  for (let i = 0; i < 180; i++)
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.007,
      sp: Math.random() * 0.12 + 0.04,
    });
}
function drawBg() {
  ctx.clearRect(0, 0, W, H);
  [
    [W * 0.1, H * 0.3, 160, "rgba(139,92,246,0.04)"],
    [W * 0.85, H * 0.5, 200, "rgba(236,72,153,0.03)"],
  ].forEach(([x, y, r, c]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  stars.forEach((s) => {
    s.a += s.da;
    if (s.a > 1 || s.a < 0) s.da *= -1;
    s.y += s.sp;
    if (s.y > H) {
      s.y = 0;
      s.x = Math.random() * W;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, s.a))})`;
    ctx.fill();
  });
  requestAnimationFrame(drawBg);
}
resize();
initS();
drawBg();
window.addEventListener("resize", () => {
  resize();
  initS();
});

/* ══════════════════════════════════════════════════════
   ÉTAT GLOBAL DE PROGRESSION
   progress[stepId][subId] = "locked" | "active" | "done"
══════════════════════════════════════════════════════ */
let roadmap = null;
let progress = []; // progress[i][j] = statut de la sous-étape
let currentPanel = -1; // index de l'étape ouverte dans le panel

/* ── Initialisation de la progression ── */
function initProgress(steps) {
  progress = steps.map((step, si) =>
    step.substeps.map((_, ssi) => {
      // Seule la première sous-étape de la première étape est active au départ
      if (si === 0 && ssi === 0) return "active";
      return "locked";
    }),
  );
}

/* ── Calcule le statut affiché d'une étape principale ── */
function getStepStatus(si) {
  const subs = progress[si];
  if (subs.every((s) => s === "done")) return "done";
  if (subs.some((s) => s === "active")) return "active";
  return "locked";
}

/* ── Compte les sous-étapes terminées ── */
function countDone(si) {
  return progress[si].filter((s) => s === "done").length;
}

/* ══════════════════════════════════════════════════════
   RENDU DYNAMIQUE DE LA MAP (planètes)
══════════════════════════════════════════════════════ */
function renderMap() {
  const container = document.getElementById("nodes-row");
  container.innerHTML = roadmap.steps
    .map((step, si) => {
      const status = getStepStatus(si);
      const num = String(si + 1).padStart(2, "0");

      const plClass =
        status === "done"
          ? "pl-done"
          : status === "active"
            ? "pl-active"
            : "pl-locked";
      const ringClass =
        status === "done"
          ? "ring-done"
          : status === "locked"
            ? "ring-locked"
            : "";
      const nmClass =
        status === "done"
          ? "nm-done"
          : status === "active"
            ? "nm-active"
            : "nm-locked";
      const npClass =
        status === "done"
          ? "np-done"
          : status === "active"
            ? "np-active"
            : "np-locked";
      const pillLabel =
        status === "done"
          ? "Terminée"
          : status === "active"
            ? "En cours"
            : "Verrouillé";

      const clickable = status !== "locked" ? `onclick="showStep(${si})"` : "";

      const pwClass =
        status === "active"
          ? "pw-active"
          : status === "done"
            ? "pw-done"
            : "pw-locked";
      const innerIcon =
        status === "done"
          ? `<div class="planet-check">✓</div>`
          : status === "locked"
            ? `<div class="planet-lock">🔒</div>`
            : "";

      return `
      <div class="node" ${clickable}>
        <div class="node-num">${num}</div>
        <div class="planet-wrap ${pwClass}">
          <div class="planet ${plClass}" id="p${si}">
            <div class="ring ${ringClass}"></div>
            ${innerIcon}
          </div>
        </div>
        <div class="node-name ${nmClass}">${step.title}</div>
        <div class="node-pill ${npClass}">${pillLabel}</div>
      </div>`;
    })
    .join("");

  requestAnimationFrame(drawConnections);
}

/* ══════════════════════════════════════════════════════
   LIGNES DE CONNEXION DYNAMIQUES (SVG)
══════════════════════════════════════════════════════ */
const CONN_COLOR = {
  done: "#10b981",
  active: "#8b5cf6",
  locked: "#2a2540",
};

function drawConnections() {
  const hmap = document.querySelector(".hmap");
  if (!hmap) return;

  let svg = document.getElementById("hline-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "hline-svg";
    hmap.appendChild(svg);
  }
  svg.innerHTML = "";

  const hmapRect = hmap.getBoundingClientRect();
  const nodes = hmap.querySelectorAll(".planet-wrap");
  const statuses = roadmap.steps.map((_, si) => getStepStatus(si));

  svg.setAttribute("height", hmapRect.height);
  svg.setAttribute("viewBox", "0 0 " + hmapRect.width + " " + hmapRect.height);

  const NS = "http://www.w3.org/2000/svg";
  let gIdx = 0;

  nodes.forEach((wrap, i) => {
    if (i === nodes.length - 1) return;

    const nextWrap = nodes[i + 1];
    const rA = wrap.getBoundingClientRect();
    const rB = nextWrap.getBoundingClientRect();

    const x1 = rA.left - hmapRect.left + rA.width / 2;
    const x2 = rB.left - hmapRect.left + rB.width / 2;
    const y = rA.top - hmapRect.top + rA.height / 2;

    const cA = CONN_COLOR[statuses[i]];
    const cB = CONN_COLOR[statuses[i + 1]];
    const gId = "sg" + gIdx++;

    const defs = document.createElementNS(NS, "defs");
    const lg = document.createElementNS(NS, "linearGradient");
    lg.setAttribute("id", gId);
    lg.setAttribute("gradientUnits", "userSpaceOnUse");
    lg.setAttribute("x1", x1);
    lg.setAttribute("y1", y);
    lg.setAttribute("x2", x2);
    lg.setAttribute("y2", y);
    const s1 = document.createElementNS(NS, "stop");
    s1.setAttribute("offset", "0%");
    s1.setAttribute("stop-color", cA);
    const s2 = document.createElementNS(NS, "stop");
    s2.setAttribute("offset", "100%");
    s2.setAttribute("stop-color", cB);
    lg.appendChild(s1);
    lg.appendChild(s2);
    defs.appendChild(lg);
    svg.appendChild(defs);

    // Lueur de fond
    const glow = document.createElementNS(NS, "line");
    glow.setAttribute("x1", x1);
    glow.setAttribute("y1", y);
    glow.setAttribute("x2", x2);
    glow.setAttribute("y2", y);
    glow.setAttribute("stroke", "url(#" + gId + ")");
    glow.setAttribute("stroke-width", "9");
    glow.setAttribute("stroke-opacity", "0.15");
    glow.setAttribute("stroke-linecap", "round");
    svg.appendChild(glow);

    // Trait principal
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "url(#" + gId + ")");
    line.setAttribute("stroke-width", "2.5");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);

    // Tirets animés si pas entièrement locked
    if (statuses[i] !== "locked" || statuses[i + 1] !== "locked") {
      const dash = document.createElementNS(NS, "line");
      dash.setAttribute("x1", x1);
      dash.setAttribute("y1", y);
      dash.setAttribute("x2", x2);
      dash.setAttribute("y2", y);
      dash.setAttribute("stroke", "url(#" + gId + ")");
      dash.setAttribute("stroke-width", "2");
      dash.setAttribute("stroke-linecap", "round");
      dash.setAttribute("stroke-dasharray", "5 13");
      dash.setAttribute("stroke-opacity", "0.5");
      const dur = statuses[i] === "done" ? "1.8s" : "2.6s";
      dash.style.animation = "dashFlow " + dur + " linear infinite";
      svg.appendChild(dash);
    }
  });
}

(function () {
  if (document.getElementById("dash-anim-style")) return;
  const st = document.createElement("style");
  st.id = "dash-anim-style";
  st.textContent =
    "@keyframes dashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -18; } }";
  document.head.appendChild(st);
})();

/* ══════════════════════════════════════════════════════
   RENDU DU PANEL DE DÉTAIL
══════════════════════════════════════════════════════ */
function showStep(si) {
  const status = getStepStatus(si);
  if (status === "locked") return; // Ne rien faire si verrouillée

  if (currentPanel === si) {
    currentPanel = -1;
    renderPanel(-1);
    // Retire le highlight
    document
      .querySelectorAll(".planet")
      .forEach((p) => (p.style.outline = "none"));
    return;
  }
  currentPanel = si;

  // Highlight planète sélectionnée
  document.querySelectorAll(".planet").forEach((p, i) => {
    p.style.outline = i === si ? "2px solid rgba(255,255,255,0.25)" : "none";
  });

  renderPanel(si);
  document
    .getElementById("detail-container")
    .scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderPanel(si) {
  const c = document.getElementById("detail-container");

  if (si < 0) {
    c.innerHTML = `<div class="panel-placeholder"><div class="pp-icon">🪐</div><div class="pp-text">Clique sur une planète pour explorer son contenu</div></div>`;
    return;
  }

  const step = roadmap.steps[si];
  const status = getStepStatus(si);
  const done = countDone(si);
  const total = step.substeps.length;
  const pct = Math.round((done / total) * 100);
  const isDone = status === "done";

  const badgeClass = isDone
    ? "dpb-done"
    : status === "active"
      ? "dpb-active"
      : "dpb-locked";
  const badgeLabel = isDone
    ? "Terminée ✓"
    : status === "active"
      ? "En cours"
      : "Verrouillé 🔒";

  const resourceLinks = [
    {
      icon: "▶",
      buildUrl: (r) =>
        `https://www.youtube.com/results?search_query=${encodeURIComponent(r)}`,
    },
    {
      icon: "🌐",
      buildUrl: (r) =>
        `https://www.google.com/search?q=${encodeURIComponent(r)}`,
    },
    {
      icon: "📱",
      buildUrl: (r) =>
        `https://play.google.com/store/search?q=${encodeURIComponent(r)}&c=apps`,
    },
  ];
  const tagsHTML = (step.resources || [])
    .map((r, idx) => {
      const link = resourceLinks[idx] || resourceLinks[2];
      const url = link.buildUrl(r);
      return `<a class="dp-tag dp-tag-link" href="${url}" target="_blank" rel="noopener noreferrer">${link.icon} ${r}</a>`;
    })
    .join("");

  const subsHTML = step.substeps
    .map((sub, ssi) => {
      const subStatus = progress[si][ssi];
      const cls =
        subStatus === "done"
          ? "ds-done"
          : subStatus === "active"
            ? "ds-active"
            : "";

      const ico =
        subStatus === "done"
          ? '<div class="dsub-ico dsi-done">✓</div>'
          : subStatus === "active"
            ? '<div class="dsub-ico dsi-active">→</div>'
            : '<div class="dsub-ico dsi-lock">🔒</div>';

      const nameCls =
        subStatus === "done"
          ? "t-done"
          : subStatus === "locked"
            ? "t-lock"
            : "";

      const btn =
        subStatus === "done"
          ? `<div class="dsub-btn done">✓ Validé</div>`
          : subStatus === "active"
            ? `<button class="dsub-btn" onclick="openQuiz(${si},${ssi})">⚔ Passer le test</button>`
            : "";

      return `
      <div class="dsub ${cls}">
        ${ico}
        <div class="dsub-body">
          <div class="dsub-name ${nameCls}">${sub.title}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px;line-height:1.5;white-space:normal">${sub.content}</div>
          ${btn}
        </div>
      </div>`;
    })
    .join("");

  c.innerHTML = `
    <div class="detail-panel">
      <div class="dp-head">
        <div class="dp-left">
          <div class="dp-num">ÉTAPE ${String(si + 1).padStart(2, "0")}</div>
          <div class="dp-title">${step.title}</div>
          <div class="dp-meta">
            <span>${total} sous-étapes</span>
            <div class="dp-sep"></div>
            <span>${step.resources?.[2] || ""}</span>
          </div>
        </div>
        <span class="dp-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="dp-desc">${step.description}</div>
      <div class="dp-tags">${tagsHTML}</div>
      <div class="dp-prog">
        <div class="dpp-row"><span>Progression</span><span>${done} / ${total} sous-étapes</span></div>
        <div class="dpp-track"><div class="dpp-fill ${isDone ? "f-done" : ""}" style="width:${pct}%"></div></div>
      </div>
      <div class="dp-subs">${subsHTML}</div>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   SYSTÈME DE PROGRESSION
══════════════════════════════════════════════════════ */

/* Appelée après validation correcte d'un QCM */
function progressTo(si, ssi) {
  // Marque la sous-étape courante comme done
  progress[si][ssi] = "done";

  // Détermine la prochaine sous-étape / étape à déverrouiller
  const step = roadmap.steps[si];
  const nextSsi = ssi + 1;

  if (nextSsi < step.substeps.length) {
    // Sous-étape suivante dans la même étape
    progress[si][nextSsi] = "active";
  } else {
    // Toutes les sous-étapes de cette étape sont terminées → active l'étape suivante
    const nextSi = si + 1;
    if (nextSi < roadmap.steps.length) {
      progress[nextSi][0] = "active";
    }
  }

  // Re-render
  renderMap();
  renderPanel(currentPanel);
  autoSaveRoadmap();
}

/* ══════════════════════════════════════════════════════
   MODAL QCM
══════════════════════════════════════════════════════ */
let quizState = {
  stepId: -1,
  subId: -1,
  correctIndex: -1,
  selectedIndex: -1,
  answered: false,
};

function openQuiz(si, ssi) {
  const sub = roadmap.steps[si].substeps[ssi];
  const quiz = sub.quiz;
  if (!quiz) return;

  quizState = {
    stepId: si,
    subId: ssi,
    correctIndex: quiz.answerIndex,
    selectedIndex: -1,
    answered: false,
  };

  document.getElementById("modal-question").textContent = quiz.question;

  const optContainer = document.getElementById("modal-options");
  optContainer.innerHTML = quiz.options
    .map(
      (opt, i) =>
        `<button class="opt-btn" data-idx="${i}" onclick="selectOption(${i})">${opt}</button>`,
    )
    .join("");

  document.getElementById("modal-feedback").className = "modal-feedback";
  document.getElementById("modal-feedback").textContent = "";
  document.getElementById("modal-validate").disabled = true;
  document.getElementById("modal-continue").style.display = "none";
  document.getElementById("modal-overlay").classList.add("show");
}

function selectOption(idx) {
  if (quizState.answered) return;
  quizState.selectedIndex = idx;
  document.querySelectorAll(".opt-btn").forEach((btn, i) => {
    btn.classList.toggle("selected", i === idx);
  });
  document.getElementById("modal-validate").disabled = false;
}

async function submitAnswer() {
  if (quizState.selectedIndex < 0 || quizState.answered) return;

  // Appel backend pour vérifier
  let isCorrect = false;
  try {
    const res = await fetch("/api/check-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerIndex: quizState.selectedIndex,
        correctIndex: quizState.correctIndex,
      }),
    });
    const data = await res.json();
    isCorrect = data.isCorrect;
  } catch (e) {
    // Fallback client-side si le serveur est inaccessible
    isCorrect = quizState.selectedIndex === quizState.correctIndex;
  }

  quizState.answered = true;

  // Colorie les options
  document.querySelectorAll(".opt-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === quizState.correctIndex) btn.classList.add("correct");
    else if (i === quizState.selectedIndex && !isCorrect)
      btn.classList.add("wrong");
  });

  const feedback = document.getElementById("modal-feedback");
  if (isCorrect) {
    feedback.textContent = "✓ Bonne réponse ! Tu peux passer à la suite.";
    feedback.className = "modal-feedback success";
    document.getElementById("modal-continue").style.display = "block";
    document.getElementById("modal-validate").style.display = "none";
  } else {
    feedback.textContent =
      "✗ Mauvaise réponse. La bonne réponse est surlignée en vert. Réessaie !";
    feedback.className = "modal-feedback error";
    // Permet de réessayer
    setTimeout(() => {
      quizState.answered = false;
      quizState.selectedIndex = -1;
      document.querySelectorAll(".opt-btn").forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove("wrong", "correct", "selected");
      });
      document.getElementById("modal-validate").disabled = true;
      feedback.className = "modal-feedback";
    }, 2200);
  }
}

function closeModalAndProgress() {
  const { stepId, subId } = quizState;
  closeModal();
  progressTo(stepId, subId);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("show");
  document.getElementById("modal-validate").style.display = "block";
}

/* Clic hors modal */
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal-overlay")) closeModal();
});

/* ══════════════════════════════════════════════════════
   CHARGEMENT INITIAL
══════════════════════════════════════════════════════ */
function loadRoadmap() {
  const raw = sessionStorage.getItem("ascendia_roadmap");

  if (!raw) {
    // Pas de roadmap → redirige vers l'accueil
    window.location.href = "/";
    return;
  }

  roadmap = JSON.parse(raw);

  /* ── Restore saved progress if available (coming from profile) ── */
  const savedProgress = sessionStorage.getItem("ascendia_progress");
  if (savedProgress) {
    try {
      progress = JSON.parse(savedProgress);
      sessionStorage.removeItem("ascendia_progress");
    } catch (_) {
      initProgress(roadmap.steps);
    }
  } else {
    initProgress(roadmap.steps);
  }

  // Rempli le header
  document.getElementById("mname").textContent = roadmap.goal;
  document.getElementById("chip-text").textContent = "MISSION · IA GÉNÉRATIVE";
  document.getElementById("mmeta").innerHTML = `
    <span>6 étapes</span>
    <div class="mms"></div>
    <span>${roadmap.steps.reduce((acc, s) => acc + s.substeps.length, 0)} sous-étapes</span>
    <div class="mms"></div>
    <span>⏱ ${roadmap.duration}</span>
    <div class="mms"></div>
    <span>📊 ${roadmap.level}</span>`;

  document.title = `Ascendia — ${roadmap.goal}`;

  renderMap();

  // Auto-save initial state to profile
  autoSaveRoadmap();

  // Cache le loading screen
  document.getElementById("page-loading").classList.add("hidden");
}

/* ── Sauvegarde JSON ── */
function saveRoadmap() {
  const blob = new Blob([JSON.stringify({ roadmap, progress }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ascendia-roadmap.json";
  a.click();
}

/* ══════════════════════════════════════════════════════
   AUTO-SAVE TO PROFILE (localStorage)
══════════════════════════════════════════════════════ */
function computeProgress(steps, prog) {
  const total = steps.reduce((a, s) => a + s.substeps.length, 0);
  const done = prog.reduce(
    (a, row) => a + row.filter((s) => s === "done").length,
    0,
  );
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function autoSaveRoadmap() {
  const email = localStorage.getItem("email");
  if (!email || !roadmap) return;

  const KEY = "ascendia_roadmaps_" + email;
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (_) {}

  const pct = computeProgress(roadmap.steps, progress);
  const isDone = pct === 100;
  const id =
    "rm_" +
    btoa(roadmap.goal)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 16);

  const entry = {
    id,
    name: roadmap.goal,
    icon: "🗺️",
    steps: roadmap.steps.length,
    duration: roadmap.duration || "—",
    status: isDone ? "done" : "active",
    progress: pct,
    roadmapData: roadmap,
    progressData: progress,
    savedAt: Date.now(),
  };

  const idx = saved.findIndex((r) => r.id === id);
  if (idx >= 0) saved[idx] = entry;
  else saved.unshift(entry);

  localStorage.setItem(KEY, JSON.stringify(saved));

  /* Log activity */
  if (pct > 0) {
    const ACTS_KEY = "ascendia_activities_" + email;
    let acts = [];
    try {
      acts = JSON.parse(localStorage.getItem(ACTS_KEY) || "[]");
    } catch (_) {}
    acts.unshift({
      id: Date.now(),
      type: isDone ? "fin" : "ok",
      text: isDone
        ? `Roadmap <b>${roadmap.goal}</b> completed at 100% 🎉`
        : `Progression <b>${roadmap.goal}</b> — ${pct}%`,
      time: "just now",
      ts: Date.now(),
    });
    if (acts.length > 20) acts.pop();
    localStorage.setItem(ACTS_KEY, JSON.stringify(acts));
  }

  /* Update steps-done stat */
  const STATS_KEY = "ascendia_stats_" + email;
  let stats = { stepsCompleted: 0, correctAnswers: 0, totalQuestions: 0 };
  try {
    stats = JSON.parse(
      localStorage.getItem(STATS_KEY) || JSON.stringify(stats),
    );
  } catch (_) {}
  const doneCount = progress.reduce(
    (a, row) => a + row.filter((s) => s === "done").length,
    0,
  );
  /* Only update if higher (avoid going down on reload) */
  if (doneCount > (stats.stepsCompleted || 0)) {
    stats.stepsCompleted = doneCount;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
}

/* ── Lancement ── */
loadRoadmap();
