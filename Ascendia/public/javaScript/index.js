/* ═══════════════════════════════════════
   ASCENDIA — index.js
═══════════════════════════════════════ */

/* ── Navbar: render based on auth state ── */
(function renderNav() {
  const email = localStorage.getItem("email");
  const firstname = localStorage.getItem("firstname");
  const navRight = document.getElementById("nav-right");
  if (!navRight) return;

  // Mark active link based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const page = link.getAttribute("data-page");
    if (
      (page === "index" &&
        (currentPage === "" || currentPage === "index.html")) ||
      currentPage.includes(page)
    ) {
      link.classList.add("active");
    }
  });

  if (email) {
    // Logged in: show only profile button
    const initials = firstname
      ? firstname.charAt(0).toUpperCase()
      : email.charAt(0).toUpperCase();
    const displayName = firstname || email.split("@")[0];

    navRight.innerHTML = `
      <a href="profile.html" class="nav-profile nav-link-profile" data-page="profile">
        <span class="nav-profile-icon" style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px">${initials}</span>
        <span>${displayName}</span>
      </a>
    `;

    // Mark profile active if on profile page
    if (currentPage.includes("profile")) {
      navRight.querySelector(".nav-link-profile")?.classList.add("active");
    }
  } else {
    // Not logged in: show Inscription (bordered) + Connexion
    navRight.innerHTML = `
      <a href="authentification.html" class="nav-register">Inscription</a>
      <a href="login.html" class="nav-login">Connexion</a>
    `;
  }
})();

/* ── Interactive Canvas Background ── */
(function initCanvas() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%";
  document.body.prepend(canvas);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W,
    H,
    mouse = { x: -9999, y: -9999 };
  const NODES = [];
  const NODE_COUNT = 150;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  // Node class
  class Node {
    constructor() {
      this.reset(true);
    }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.3 + 0.1);
      this.r = Math.random() * 2 + 0.8;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.color =
        Math.random() > 0.6
          ? "#8b5cf6"
          : Math.random() > 0.5
            ? "#ec4899"
            : "#a78bfa";
    }
    update() {
      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = ((120 - dist) / 120) * 0.8;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
      // Damping
      this.vx *= 0.98;
      this.vy *= 0.98;
      // Drift
      this.vx += (Math.random() - 0.5) * 0.02;
      this.x += this.vx;
      this.y += this.vy;
      // Wrap horizontally
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      // Reset if off top
      if (this.y < -20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < NODE_COUNT; i++) NODES.push(new Node());

  function drawConnections() {
    const MAX_DIST = 110;
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const dx = NODES[i].x - NODES[j].x;
        const dy = NODES[i].y - NODES[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.18;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#8b5cf6";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(NODES[i].x, NODES[i].y);
          ctx.lineTo(NODES[j].x, NODES[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    NODES.forEach((n) => {
      n.update();
      n.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  // Mouse tracking
  document.querySelector(".hero")?.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Move cursor glow
    const glow = document.querySelector(".cursor-glow");
    if (glow) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }
  });

  document.querySelector(".hero")?.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
    const glow = document.querySelector(".cursor-glow");
    if (glow) glow.style.opacity = "0";
  });

  document.querySelector(".hero")?.addEventListener("mouseenter", () => {
    const glow = document.querySelector(".cursor-glow");
    if (glow) glow.style.opacity = "1";
  });
})();

/* ── Floating particles (DOM) ── */
(function spawnParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const colors = ["#8b5cf6", "#a78bfa", "#ec4899", "#c4b5fd", "#10b981"];

  for (let i = 0; i < 100; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 1.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const dur = Math.random() * 10 + 8;
    const delay = Math.random() * 12;
    const travel = -(Math.random() * 200 + 80);
    const xtravel = (Math.random() - 0.5) * 100;
    const op = Math.random() * 0.5 + 0.2;

    p.style.cssText = `
      left: ${left}%;
      bottom: ${Math.random() * 30}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 3}px ${color};
      --dur: ${dur}s;
      --delay: -${delay}s;
      --travel: ${travel}px;
      --xtravel: ${xtravel}px;
      --op: ${op};
    `;
    container.appendChild(p);
  }
})();

/* ── Shooting stars ── */
(function spawnShootingStars() {
  const hero = document.querySelector(".hero-bg");
  if (!hero) return;

  for (let i = 0; i < 10; i++) {
    const s = document.createElement("div");
    s.className = "shooting-star";
    s.style.cssText = `
      left: ${Math.random() * 80 + 10}%;
      top: ${Math.random() * 40}%;
      --angle: ${Math.random() * 20 + 25}deg;
      --sdur: ${Math.random() * 4 + 3}s;
      --sdelay: -${Math.random() * 8}s;
    `;
    hero.appendChild(s);
  }
})();

/* ── Cursor glow element ── */
(function addCursorGlow() {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.style.opacity = "0";
  document.body.appendChild(glow);
})();

/* ── Fill from suggestion ── */
function fillGoal(text) {
  const input = document.getElementById("goal-input");
  input.value = text;
  input.focus();
  document.getElementById("error-box").classList.remove("show");

  // Subtle pulse on search wrap
  const wrap = document.querySelector(".search-wrap");
  wrap.style.boxShadow = "0 0 40px rgba(139, 92, 246, 0.2)";
  setTimeout(() => {
    wrap.style.boxShadow = "";
  }, 600);
}

/* ── Enter to submit ── */
document.getElementById("goal-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    generateRoadmap();
  }
});

/* ── Loading messages ── */
const loadingMessages = [
  "Analyse de l'objectif…",
  "Structuration des étapes…",
  "Génération des ressources…",
  "Calibration de la difficulté…",
  "Finalisation de la roadmap…",
];
let msgInterval;

function startLoadingMessages() {
  let idx = 0;
  const el = document.getElementById("loading-msg");
  el.textContent = loadingMessages[0];
  msgInterval = setInterval(() => {
    idx = (idx + 1) % loadingMessages.length;
    el.textContent = loadingMessages[idx];
  }, 2000);
}

function stopLoadingMessages() {
  clearInterval(msgInterval);
}

/* ── Generate roadmap ── */
async function generateRoadmap() {
  const goal = document.getElementById("goal-input").value.trim();
  const errorBox = document.getElementById("error-box");
  errorBox.classList.remove("show");

  if (!goal) {
    errorBox.textContent = "⚠ Veuillez décrire votre objectif d'apprentissage.";
    errorBox.classList.add("show");
    return;
  }

  const btn = document.getElementById("btn-gen");
  btn.disabled = true;
  btn.innerHTML = 'Génération… <span class="btn-arrow"></span>';
  document.getElementById("loading").classList.add("show");
  document.getElementById("suggestion-chips").style.opacity = "0.3";
  startLoadingMessages();

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Erreur serveur");
    sessionStorage.setItem("ascendia_roadmap", JSON.stringify(data.roadmap));
    window.location.href = "/roadmap.html";
  } catch (err) {
    stopLoadingMessages();
    document.getElementById("loading").classList.remove("show");
    document.getElementById("suggestion-chips").style.opacity = "1";
    btn.disabled = false;
    btn.innerHTML = 'Générer ma roadmap <span class="btn-arrow">→</span>';
    errorBox.textContent =
      "❌ " + (err.message || "Erreur inattendue. Réessayez.");
    errorBox.classList.add("show");
  }
}
