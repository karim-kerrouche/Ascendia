/* ── Navbar ── */
(function renderNav() {
  const email = localStorage.getItem("email");
  const firstname = localStorage.getItem("firstname");
  const navRight = document.getElementById("nav-right");
  if (!navRight) return;

  if (email) {
    const initials = firstname
      ? firstname.charAt(0).toUpperCase()
      : email.charAt(0).toUpperCase();
    const displayName = firstname || email.split("@")[0];
    navRight.innerHTML = `
            <a href="profile.html" class="nav-profile">
              <span class="nav-profile-icon" style="font-weight:700;font-size:11px">${initials}</span>
              <span>${displayName}</span>
            </a>
          `;
  } else {
    navRight.innerHTML = `
            <a href="authentification.html" class="nav-register">Inscription</a>
            <a href="login.html" class="nav-login">Connexion</a>
          `;
  }
})();

/* ── Render roadmaps ── */
(function renderContent() {
  const area = document.getElementById("content-area");
  const email = localStorage.getItem("email");

  if (!email) {
    area.innerHTML = `
            <div class="auth-gate">
              <div class="auth-gate-icon">🔒</div>
              <h2>Connecte-toi pour voir tes roadmaps</h2>
              <p>Tes roadmaps sauvegardées sont liées à ton compte. Inscris-toi ou connecte-toi pour y accéder.</p>
              <div class="auth-gate-btns">
                <a href="authentification.html" class="btn-create">Créer un compte</a>
                <a href="login.html" style="display:inline-flex;align-items:center;padding:12px 28px;border-radius:var(--radius-md);border:0.5px solid var(--border-p);color:var(--purple-l);font-size:14px;transition:all 0.2s" onmouseover="this.style.background='rgba(139,92,246,0.1)'" onmouseout="this.style.background='transparent'">Connexion</a>
              </div>
            </div>
          `;
    return;
  }

  // Load saved roadmaps from localStorage (keyed by email)
  // roadmap.js saves under key "ascendia_roadmaps_<email>"
  const storageKey = `ascendia_roadmaps_${email}`;
  let roadmaps = [];
  try {
    roadmaps = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (e) {
    roadmaps = [];
  }

  if (roadmaps.length === 0) {
    area.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">🗺️</div>
              <div class="empty-title">Aucune roadmap sauvegardée</div>
              <div class="empty-sub">Génère ta première roadmap depuis la page d'accueil et sauvegarde-la pour la retrouver ici.</div>
              <a href="index.html" class="btn-create">✦ Créer une roadmap</a>
            </div>
          `;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "rm-grid";

  roadmaps.forEach((rm, idx) => {
    // roadmap.js stores: { id, name, icon, steps, duration, status, progress,
    //                       roadmapData, progressData, savedAt }
    const pct = rm.progress || 0;
    const roadmapData = rm.roadmapData || {};
    const steps = roadmapData.steps || [];
    const totalSubsteps = steps.reduce(
      (a, s) => a + (s.substeps ? s.substeps.length : 0),
      0,
    );
    const progressData = rm.progressData || [];
    const completedSubsteps = progressData.reduce(
      (a, row) =>
        a + (Array.isArray(row) ? row.filter((s) => s === "done").length : 0),
      0,
    );
    const date = rm.savedAt
      ? new Date(rm.savedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Date inconnue";

    const card = document.createElement("div");
    card.className = "rm-card";
    card.innerHTML = `
            <div class="rm-card-goal">${rm.name || "Roadmap sans titre"}</div>
            <div class="rm-card-date">Sauvegardée le ${date}</div>
            <div class="rm-progress-bar">
              <div class="rm-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="rm-meta">
              <span class="rm-steps">${completedSubsteps}/${totalSubsteps} sous-étapes</span>
              <span class="rm-pct">${pct}%</span>
            </div>
            <div class="rm-card-actions">
              <button class="rm-btn-open" onclick="openRoadmap(${idx})">Reprendre →</button>
              <button class="rm-btn-del" onclick="deleteRoadmap(${idx}, event)">🗑</button>
            </div>
          `;
    grid.appendChild(card);
  });

  area.appendChild(grid);
})();

function openRoadmap(idx) {
  const email = localStorage.getItem("email");
  if (!email) return;
  const storageKey = `ascendia_roadmaps_${email}`;
  const roadmaps = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const rm = roadmaps[idx];
  if (!rm || !rm.roadmapData) return;
  // roadmap.js reads "ascendia_roadmap" for the roadmap object
  // and "ascendia_progress" for the saved progress state
  sessionStorage.setItem("ascendia_roadmap", JSON.stringify(rm.roadmapData));
  if (rm.progressData) {
    sessionStorage.setItem(
      "ascendia_progress",
      JSON.stringify(rm.progressData),
    );
  }
  window.location.href = "roadmap.html";
}

function deleteRoadmap(idx, e) {
  e.stopPropagation();
  if (!confirm("Supprimer cette roadmap ?")) return;
  const email = localStorage.getItem("email");
  if (!email) return;
  const storageKey = `ascendia_roadmaps_${email}`;
  const roadmaps = JSON.parse(localStorage.getItem(storageKey) || "[]");
  roadmaps.splice(idx, 1);
  localStorage.setItem(storageKey, JSON.stringify(roadmaps));
  location.reload();
}
