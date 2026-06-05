import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDJ0YCGOgDkaXa9IkbVb5Z8CRq5KYN0bk",
  authDomain: "ascendia-e0dcb.firebaseapp.com",
  projectId: "ascendia-e0dcb",
  storageBucket: "ascendia-e0dcb.firebasestorage.app",
  messagingSenderId: "780247264588",
  appId: "1:780247264588:web:79fac9b47e86a645ff73e9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ── Attente de l'état d'authentification Firebase ── */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    /* Non connecté — vérification du localStorage (session manuelle) */
    const email = localStorage.getItem("email");
    if (!email) {
      document.getElementById("locked-screen").classList.add("show");
      return;
    }
    /* Session localStorage valide — construit le profil depuis localStorage */
    demarrerProfil(null);
  } else {
    /* Connecté via Firebase */
    demarrerProfil(user);
  }
});

/* ── Déconnexion ── */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth).catch(() => {});
  /* Effacer uniquement les clés de session, PAS les données utilisateur */
  const emailActuel = localStorage.getItem("email");
  ["email", "firstname", "lastname", "pays", "methode"].forEach((k) =>
    localStorage.removeItem(k),
  );
  if (emailActuel) localStorage.removeItem("ascendia_profile_" + emailActuel);
  window.location.href = "login.html";
});

/* ═══════════════════════════════════════════════════════════
         DÉMARRAGE DU PROFIL — appelé une fois l'utilisateur authentifié
      ══════════════════════════════════════════════════════════════ */
function demarrerProfil(firebaseUser) {
  /* ── Construction de l'objet profil depuis localStorage + Firebase ── */
  const prenom = localStorage.getItem("firstname") || "";
  const nom = localStorage.getItem("lastname") || "";
  const email =
    localStorage.getItem("email") || (firebaseUser ? firebaseUser.email : "");
  const pays = localStorage.getItem("pays") || "—";
  const methode = localStorage.getItem("methode") || "—";

  /* Nom d'affichage */
  let nomAffiche = (prenom + " " + nom).trim();
  if (!nomAffiche && firebaseUser && firebaseUser.displayName) {
    nomAffiche = firebaseUser.displayName;
  }
  if (!nomAffiche) nomAffiche = email.split("@")[0];

  /* Date d'inscription — enregistrée une seule fois, puis conservée */
  const CLE_DB = "ascendia_profile_" + (email || "invite");
  let profilExtra = {};
  try {
    profilExtra = JSON.parse(localStorage.getItem(CLE_DB) || "{}");
  } catch (_) {}

  if (!profilExtra.memberSince) {
    const maintenant = new Date();
    profilExtra.memberSince =
      maintenant.toLocaleString("fr-FR", { month: "short" }) +
      ". " +
      maintenant.getFullYear();
    localStorage.setItem(CLE_DB, JSON.stringify(profilExtra));
  }

  /* ── État utilisé par toutes les fonctions de rendu ── */
  const state = {
    name: nomAffiche,
    email,
    location: profilExtra.location || pays || "—",
    memberSince: profilExtra.memberSince,
    method: methode,
  };

  /* ── Chargement des roadmaps sauvegardées ── */
  const CLE_ROADMAPS = "ascendia_roadmaps_" + email;
  function chargerRoadmaps() {
    try {
      return JSON.parse(localStorage.getItem(CLE_ROADMAPS) || "[]");
    } catch (_) {
      return [];
    }
  }

  /* ── Chargement des statistiques QCM ── */
  const CLE_STATS = "ascendia_stats_" + email;
  function chargerStats() {
    const defaut = {
      stepsCompleted: 0,
      correctAnswers: 0,
      totalQuestions: 0,
    };
    try {
      /* Clé exacte (email connu) */
      const direct = localStorage.getItem(CLE_STATS);
      if (direct) return { ...defaut, ...JSON.parse(direct) };
      /* Fallback : fusionner toutes les clés ascendia_stats_* trouvées */
      const merged = { ...defaut };
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ascendia_stats_"))
        .forEach((k) => {
          try {
            const s = JSON.parse(localStorage.getItem(k) || "{}");
            merged.stepsCompleted = Math.max(
              merged.stepsCompleted,
              s.stepsCompleted || 0,
            );
            merged.correctAnswers += s.correctAnswers || 0;
            merged.totalQuestions += s.totalQuestions || 0;
          } catch (_) {}
        });
      return merged;
    } catch (_) {
      return defaut;
    }
  }

  /* ── Chargement du journal d'activité ── */
  const CLE_ACTIVITES = "ascendia_activities_" + email;
  function chargerActivites() {
    try {
      return JSON.parse(localStorage.getItem(CLE_ACTIVITES) || "[]");
    } catch (_) {
      return [];
    }
  }

  /* ════════════════════════════
           RENDU
        ════════════════════════════ */
  function getInitiales(name) {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || "?"
    );
  }

  function renderProfile() {
    const av = document.getElementById("avatarInitials");
    /* Ne pas écraser si une photo est déjà chargée */
    if (!av.querySelector("img")) {
      av.innerHTML =
        getInitiales(state.name) + '<div class="avatar-overlay">📷</div>';
    }
    document.getElementById("userFullName").textContent = state.name;
    document.getElementById("userEmail").textContent = state.email;
    document.getElementById("userLocation").textContent = state.location;
    document.getElementById("userMemberSince").textContent =
      "Membre depuis " + state.memberSince;
    document.getElementById("infoName").textContent = state.name;
    document.getElementById("infoEmail").textContent = state.email;
    document.getElementById("infoLocation").textContent = state.location;
    document.getElementById("infoMemberSince").textContent = state.memberSince;
    document.getElementById("infoMethod").textContent =
      state.method === "google" ? "Google" : "E-mail / Mot de passe";
  }

  function renderStats() {
    const roadmaps = chargerRoadmaps();
    const stats = chargerStats();
    const terminees = roadmaps.filter((r) => r.status === "done").length;
    const amis = chargerAmis();

    document.getElementById("statRoadmapsCount").textContent = roadmaps.length;
    document.getElementById("statStepsCompleted").textContent =
      stats.stepsCompleted;
    document.getElementById("statFriendsCount").textContent = amis.length;
    document.getElementById("statCompletedRoadmaps").textContent = terminees;
  }

  function statutLabel(s) {
    if (s === "active") return "En cours";
    if (s === "done") return "Terminée ✓";
    if (s === "paused") return "En pause";
    return s;
  }

  function renderRoadmaps() {
    const roadmaps = chargerRoadmaps();
    const list = document.getElementById("roadmapsList");
    const actives = roadmaps.filter((r) => r.status === "active").length;
    document.getElementById("activeRoadmapsCount").textContent =
      actives + " active";

    if (roadmaps.length === 0) {
      list.innerHTML = `<div class="empty-state">
              Aucune roadmap sauvegardée pour l'instant.<br>
              <a href="index.html">Générer ma première roadmap →</a>
            </div>`;
      return;
    }

    list.innerHTML = roadmaps
      .map(
        (r) => `
            <div class="roadmap-row" onclick="reprendreRoadmap('${r.id}')">
              <div class="roadmap-icon">${r.icon || "🗺️"}</div>
              <div class="roadmap-body">
                <div class="roadmap-top">
                  <span class="roadmap-name">${r.name}</span>
                  <span class="status status-${r.status}">${statutLabel(r.status)}</span>
                </div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${r.progress}%"></div>
                  </div>
                  <span class="progress-pct">${r.progress}%</span>
                </div>
              </div>
            </div>`,
      )
      .join("");
  }

  function dotClass(type) {
    if (type === "ok") return "dot-purple";
    if (type === "new") return "dot-pink";
    if (type === "fin") return "dot-green";
    return "dot-purple";
  }

  function renderActivities() {
    const list = document.getElementById("activitiesList");
    const activites = chargerActivites().slice(0, 10);
    if (activites.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:16px">Aucune activité récente.</div>`;
      return;
    }
    list.innerHTML = activites
      .map(
        (a) => `
            <div class="activity-item">
              <div class="activity-indicator">
                <div class="activity-dot ${dotClass(a.type)}"></div>
                <div class="activity-line"></div>
              </div>
              <div class="activity-text">${a.text}</div>
              <div class="activity-time">${a.time}</div>
            </div>`,
      )
      .join("");
  }

  /* ════════════════════════════
           AMIS
        ════════════════════════════ */
  const CLE_AMIS = "ascendia_friends_" + email;
  function chargerAmis() {
    try {
      return JSON.parse(localStorage.getItem(CLE_AMIS) || "[]");
    } catch (_) {
      return [];
    }
  }
  function sauvegarderAmis(amis) {
    localStorage.setItem(CLE_AMIS, JSON.stringify(amis));
  }
  function getInitialesAmi(name) {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || "?"
    );
  }
  function renderFriends() {
    const amis = chargerAmis();
    const list = document.getElementById("friendsList");
    const badge = document.getElementById("friendsCountBadge");
    badge.textContent = amis.length + " ami(s)";
    document.getElementById("statFriendsCount").textContent = amis.length;
    if (amis.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:14px 0">Aucun ami ajouté pour l'instant.</div>`;
      return;
    }
    list.innerHTML = amis
      .map(
        (a, i) => `
            <div class="friend-item">
              <div class="friend-avatar">${getInitialesAmi(a.name)}</div>
              <div class="friend-name">${a.name}</div>
              <button class="friend-remove" onclick="supprimerAmi(${i})" title="Retirer">✕</button>
            </div>`,
      )
      .join("");
  }
  window.supprimerAmi = function (index) {
    const amis = chargerAmis();
    amis.splice(index, 1);
    sauvegarderAmis(amis);
    renderFriends();
    showToast("✓ Ami retiré");
  };
  document.getElementById("addFriendBtn").addEventListener("click", () => {
    const val = document.getElementById("friendInput").value.trim();
    if (!val) {
      showToast("⚠ Saisir un nom ou email");
      return;
    }
    const amis = chargerAmis();
    if (amis.find((a) => a.name.toLowerCase() === val.toLowerCase())) {
      showToast("⚠ Déjà dans ta liste");
      return;
    }
    amis.push({ name: val, addedAt: Date.now() });
    sauvegarderAmis(amis);
    document.getElementById("friendInput").value = "";
    renderFriends();
    ajouterActivite("new", `Ami ajouté — <b>${val}</b>`, "à l'instant");
    showToast("✓ Ami ajouté !");
  });
  document.getElementById("friendInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("addFriendBtn").click();
  });

  /* ════════════════════════════
           PHOTO DE PROFIL
        ════════════════════════════ */
  const CLE_AVATAR = "ascendia_avatar_" + email;
  function chargerAvatarPhoto() {
    const saved = localStorage.getItem(CLE_AVATAR);
    if (saved) {
      const av = document.getElementById("avatarInitials");
      av.innerHTML = `<img src="${saved}" alt="Photo de profil" /><div class="avatar-overlay">📷</div>`;
    }
  }
  document.getElementById("avatarFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(CLE_AVATAR, dataUrl);
      const av = document.getElementById("avatarInitials");
      av.innerHTML = `<img src="${dataUrl}" alt="Photo de profil" /><div class="avatar-overlay">📷</div>`;
      showToast("✓ Photo de profil mise à jour");
      ajouterActivite("ok", "Photo de profil mise à jour", "à l'instant");
      renderActivities();
    };
    reader.readAsDataURL(file);
  });

  /* ════════════════════════════
           RENDU INITIAL
        ════════════════════════════ */
  function renderAll() {
    renderProfile();
    renderStats();
    renderRoadmaps();
    renderActivities();
    renderFriends();
    chargerAvatarPhoto();
    mettreAJourBdD();
  }

  /* ════════════════════════════
           REPRENDRE UNE ROADMAP
        ════════════════════════════ */
  window.reprendreRoadmap = function (id) {
    const roadmaps = chargerRoadmaps();
    const r = roadmaps.find((x) => x.id === id);
    if (!r) return;
    sessionStorage.setItem("ascendia_roadmap", JSON.stringify(r.roadmapData));
    sessionStorage.setItem("ascendia_progress", JSON.stringify(r.progressData));
    window.location.href = "roadmap.html";
  };

  /* ════════════════════════════
           NOTIFICATION TOAST
        ════════════════════════════ */
  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ════════════════════════════
           MODIFICATION DU PROFIL
        ════════════════════════════ */
  function openEditModal() {
    document.getElementById("editName").value = state.name;
    document.getElementById("editEmail").value = state.email;
    document.getElementById("editLocation").value = state.location;
    /* Prévisualisation de l'avatar dans le modal */
    const saved = localStorage.getItem(CLE_AVATAR);
    const preview = document.getElementById("modalAvatarPreview");
    if (saved) {
      preview.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:14px" />`;
    } else {
      preview.textContent = getInitiales(state.name);
    }
    document.getElementById("editModal").classList.add("open");
  }
  function closeEditModal() {
    document.getElementById("editModal").classList.remove("open");
  }
  function saveProfile() {
    const name = document.getElementById("editName").value.trim();
    const location = document.getElementById("editLocation").value.trim();
    if (!name) {
      showToast("⚠ Le nom est obligatoire");
      return;
    }

    state.name = name;
    state.location = location;

    /* Persistance dans localStorage */
    const parts = name.split(" ");
    localStorage.setItem("firstname", parts[0] || "");
    localStorage.setItem("lastname", parts.slice(1).join(" ") || "");
    profilExtra.location = location;
    localStorage.setItem(CLE_DB, JSON.stringify(profilExtra));

    /* Journalisation de l'activité */
    ajouterActivite("ok", `Profil mis à jour — <b>${name}</b>`, "à l'instant");

    renderAll();
    closeEditModal();
    showToast("✓ Profil enregistré");
  }

  /* ════════════════════════════
           JOURNAL D'ACTIVITÉ
        ════════════════════════════ */
  function ajouterActivite(type, text, timeLabel) {
    const activites = chargerActivites();
    activites.unshift({
      id: Date.now(),
      type,
      text,
      time: timeLabel,
      ts: Date.now(),
    });
    if (activites.length > 20) activites.pop();
    localStorage.setItem(CLE_ACTIVITES, JSON.stringify(activites));
  }

  /* ════════════════════════════
           PANNEAU BASE DE DONNÉES
        ════════════════════════════ */
  function mettreAJourBdD() {
    const roadmaps = chargerRoadmaps();
    const activites = chargerActivites();
    const raw = localStorage.getItem(CLE_ROADMAPS) || "";
    const kb = (raw.length / 1024).toFixed(1);
    document.getElementById("dbStatus").innerHTML =
      `<b>${roadmaps.length}</b> roadmaps · <b>${activites.length}</b> activités<br>Stockage : <b>${kb} Ko</b>`;
  }

  /* ════════════════════════════
           ÉCOUTEURS D'ÉVÉNEMENTS
        ════════════════════════════ */
  document
    .getElementById("editProfileBtn")
    .addEventListener("click", openEditModal);

  /* Modal avatar upload */
  document
    .getElementById("modalAvatarInput")
    .addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        localStorage.setItem(CLE_AVATAR, dataUrl);
        document.getElementById("modalAvatarPreview").innerHTML =
          `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:14px" />`;
        const av = document.getElementById("avatarInitials");
        av.innerHTML = `<img src="${dataUrl}" alt="Photo de profil" /><div class="avatar-overlay">📷</div>`;
        showToast("✓ Photo mise à jour");
      };
      reader.readAsDataURL(file);
    });
  document
    .getElementById("editModalClose")
    .addEventListener("click", closeEditModal);
  document
    .getElementById("editModalCancel")
    .addEventListener("click", closeEditModal);
  document
    .getElementById("editModalSave")
    .addEventListener("click", saveProfile);

  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("editModal")) closeEditModal();
  });

  document.getElementById("dbToggle").addEventListener("click", () => {
    document.getElementById("dbPopup").classList.toggle("open");
  });

  document.getElementById("dbExport").addEventListener("click", () => {
    const data = {
      profil: state,
      roadmaps: chargerRoadmaps(),
      stats: chargerStats(),
      activites: chargerActivites(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascendia_bdd.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ Base de données exportée");
  });

  document.getElementById("dbReset").addEventListener("click", () => {
    if (confirm("Supprimer toutes les roadmaps sauvegardées ?")) {
      localStorage.removeItem(CLE_ROADMAPS);
      localStorage.removeItem(CLE_STATS);
      localStorage.removeItem(CLE_ACTIVITES);
      renderAll();
      showToast("✓ Données réinitialisées");
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".db-panel")) {
      document.getElementById("dbPopup").classList.remove("open");
    }
  });

  /* ── Rendu initial ── */
  renderAll();
}
