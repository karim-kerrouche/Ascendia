require("dotenv").config();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:");
  console.error(err);
});
console.log("1. dotenv OK");

const express = require("express");
console.log("2. express OK");

const cors = require("cors");
const path = require("path");
console.log("3. imports OK");

const { GoogleGenerativeAI } = require("@google/generative-ai");
console.log("4. GoogleGenerativeAI OK");

const app = express();
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// MODIFICATION : Sert désormais le dossier public pour les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));
console.log("5. middleware OK");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("6. genAI OK");
console.log(
  "🔑 Statut de la clé API :",
  process.env.GEMINI_API_KEY ? "Présente (OK)" : "Absente (DANGER ❌)",
);

app.post("/api/generate", async (req, res) => {
  console.log("📩 /api/generate appelé, goal:", req.body?.goal);
  const { goal } = req.body;
  if (!goal || !goal.trim()) {
    return res.status(400).json({ error: "Le champ 'goal' est requis." });
  }

  const systemPrompt = `Tu es un expert pédagogique. Génère une feuille de route d'apprentissage personnalisée en français.
RÈGLES ABSOLUES :
- Réponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après.
- Pas de markdown, pas de backticks, pas d'explication.
- Respecte EXACTEMENT la structure ci-dessous.

STRUCTURE JSON REQUISE :
{
  "goal": "string — le goal reformulé proprement dans deux mots",
  "duration": "string — durée estimée ex: '6 mois'",
  "level": "string — Débutant | Intermédiaire | Avancé",
  "steps": [
    {
      "id": 0,
      "title": "string — titre de l'étape principale EN EXACTEMENT 2 MOTS (ex: 'Bases HTML', 'Requêtes SQL')",
      "description": "string — 1-2 phrases décrivant l'étape",
      "resources": ["site web", "chaîne YouTube", "livre recommandé"],
      "substeps": [
        {
          "id": 0,
          "title": "string — titre EN EXACTEMENT 2 MOTS de la sous-étape",
          "content": "string — explication pédagogique de 3-5 phrases",
          "quiz": {
            "question": "string — question niveau avancé QCM",
            "options": ["option A", "option B", "option C", "option D"],
            "answerIndex": 0
          }
        }
      ]
    }
  ]
}

CONTRAINTES :
- Génère EXACTEMENT 6 étapes (steps[0] à steps[5]).
- Chaque étape contient EXACTEMENT 3 sous-étapes (substeps[0] à substeps[2]).
- TOUS les "title" (étapes ET sous-étapes) doivent contenir EXACTEMENT 2 mots — ni plus, ni moins.
- Les "resources" sont toujours un tableau de 3 chaînes.
- "answerIndex" est un entier entre 0 et 3 (index de la bonne réponse dans "options").
- Le JSON doit être parseable directement par JSON.parse().`;

  const userPrompt = `Génère la roadmap d'apprentissage pour l'objectif suivant : "${goal}"`;

  try {
    console.log("7. Création du modèle...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });
    console.log("8. Modèle créé, envoi à Gemini...");

    const result = await model.generateContent(
      `${systemPrompt}\n\n${userPrompt}`,
    );
    console.log("9. Réponse reçue de Gemini");

    const text = result.response.text();
    const clean = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const roadmap = JSON.parse(clean);

    if (!roadmap.steps || roadmap.steps.length !== 6) {
      throw new Error("La structure JSON retournée est invalide (≠ 6 étapes).");
    }

    console.log("10. Roadmap générée avec succès ✅");
    return res.json({ success: true, roadmap });
  } catch (err) {
    console.error("❌ Erreur /api/generate :", err.message);
    return res
      .status(500)
      .json({ error: "Erreur lors de la génération.", detail: err.message });
  }
});

app.post("/api/check-answer", (req, res) => {
  const { answerIndex, correctIndex } = req.body;
  if (answerIndex === undefined || correctIndex === undefined) {
    return res.status(400).json({ error: "Paramètres manquants." });
  }
  const isCorrect = Number(answerIndex) === Number(correctIndex);
  return res.json({ success: true, isCorrect });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur Ascendia démarré sur http://localhost:${PORT}`);
  console.log(`✅ Aussi accessible sur http://127.0.0.1:${PORT}`);
});
