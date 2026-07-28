// ============================================================
// src/pages/api/chat.ts
// Endpoint serveur Astro pour l'assistant "Meuh-bot".
// Reçoit un message utilisateur (POST), construit un contexte
// à partir de la base d'outils locale, puis interroge Gemini
// via le SDK officiel @google/genai.
// ============================================================

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import toolsData from '../../data/tools.json';

// Empêche Astro de pré-rendre cette route au build : elle doit
// s'exécuter côté serveur à chaque requête (nécessite un adapter
// SSR — voir les instructions d'intégration).
export const prerender = false;

// ------------------------------------------------------------
// 1. NORMALISATION DE LA BASE D'OUTILS
//    (même logique de nettoyage que dans src/pages/index.astro,
//    pour rester cohérent avec ce qui est affiché sur le site)
// ------------------------------------------------------------
const sanitizeText = (txt: string): string => {
  if (!txt) return '';
  return txt
    .replace(/\[↑\]\(#-table-of-contents\)/gi, '')
    .replace(/\[↑\]\(#.*?\)/gi, '')
    .replace(/\[\^.*?\]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
};

type Tool = {
  id: number;
  title: string;
  url: string;
  source: string;
  cleanCategory: string;
  pricing: string;
  safeDesc: string;
  requiresApi: boolean;
  appType: string;
};

const enrichedTools: Tool[] = (toolsData as any[]).map((tool, index) => {
  const rawDesc = tool.description || tool.safeDesc || 'Pas de description disponible.';
  return {
    id: tool.id || index + 1,
    title: sanitizeText(tool.title || tool.name || 'Outil sans nom'),
    url: tool.url || '#',
    source: tool.source || 'free_for_dev',
    cleanCategory: sanitizeText(tool.category || tool.cleanCategory || 'Général'),
    pricing: tool.pricing || 'Gratuit',
    safeDesc: sanitizeText(rawDesc),
    requiresApi: Boolean(tool.requiresApi) || false,
    appType: tool.appType || 'Web',
  };
});

// ------------------------------------------------------------
// 2. CONSTRUCTION DU CONTEXTE (System Instruction) POUR GEMINI
//    IMPORTANT : la base complète (tools.json) pèse ~1.4 Mo, soit
//    environ 350-400k tokens — ça dépasse à elle seule le quota
//    gratuit de Gemini (250k tokens/minute). On ne construit donc
//    PLUS un contexte unique avec TOUS les outils : à chaque
//    requête, on filtre la base par mots-clés pour ne garder que
//    les outils pertinents à la question posée (quelques dizaines
//    max), ce qui réduit la taille du prompt de plus de 90%.
// ------------------------------------------------------------
function buildToolsContext(tools: Tool[]): string {
  return tools
    .map((t) => {
      const apiFlag = t.requiresApi ? ' [API requise]' : '';
      return `- ${t.title} | Catégorie: ${t.cleanCategory} | Type: ${t.appType} | Prix: ${t.pricing}${apiFlag} | ${t.safeDesc} | Lien: ${t.url}`;
    })
    .join('\n');
}

// Nombre maximum d'outils envoyés en contexte à chaque requête.
const MAX_TOOLS_IN_CONTEXT = 25;

// Mots vides français à ignorer lors de l'extraction de mots-clés
// (sinon "un", "de", "pour" matcheraient presque tous les outils).
const STOPWORDS = new Set([
  'le','la','les','un','une','des','de','du','et','ou','pour','avec','sans',
  'sur','dans','par','en','au','aux','ce','ces','cette','je','tu','il','elle',
  'nous','vous','ils','elles','a','ai','as','ont','est','sont','que','qui',
  'quoi','comment','quel','quelle','quels','quelles','cherche','cherches',
  'trouve','trouver','veux','voudrais','peux','peut','svp','merci',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Sélectionne les outils les plus pertinents pour une question donnée,
// en scorant chaque outil selon le nombre de mots-clés qui matchent
// son titre, sa catégorie ou sa description.
function selectRelevantTools(query: string, tools: Tool[], max = MAX_TOOLS_IN_CONTEXT): Tool[] {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return tools.slice(0, max);

  const scored = tools.map((t) => {
    const haystack = `${t.title} ${t.cleanCategory} ${t.safeDesc} ${t.appType}`
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1;
      if (t.title.toLowerCase().includes(kw)) score += 2; // le titre compte double
    }
    return { tool: t, score };
  });

  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  // Si rien ne matche vraiment, on retombe sur un petit échantillon
  // générique plutôt que d'envoyer 0 outil (le modèle pourra au moins
  // dire honnêtement qu'il ne trouve rien de précis).
  const pool = matched.length > 0 ? matched : scored.slice(0, max).map((s) => ({ ...s, score: 0 }));

  return pool.slice(0, max).map((s) => s.tool);
}

function buildSystemInstruction(relevantTools: Tool[]): string {
  const toolsContext = buildToolsContext(relevantTools);
  return `Tu es une vache hackeuse bienveillante. Tu réponds aux questions en t'aidant EXCLUSIVEMENT de la base de données fournie. Fais quelques jeux de mots avec les vaches (Meuh, étable, pâturage), sois utile et donne les liens des outils.

Règles impératives :
- Ne recommande QUE des outils présents dans la base de données ci-dessous. N'invente jamais un outil, une URL ou une fonctionnalité qui n'y figure pas.
- Si aucun outil de la base ne correspond à la demande, dis-le honnêtement (avec humour bovin) plutôt que d'inventer une réponse.
- Quand tu recommandes un outil, donne systématiquement son lien exact tel qu'il apparaît dans la base.
- Reste concis : 2 à 5 phrases suffisent, avec une liste à puces si tu proposes plusieurs outils.
- Tu peux répondre en te basant sur l'historique de la conversation fourni pour garder le fil.
- Note : la liste ci-dessous est un extrait pertinent de la base complète (filtré selon la question), pas la totalité du catalogue.

=== EXTRAIT PERTINENT DE LA BASE DE DONNÉES (Dev & OSINT Vault) ===
${toolsContext}
=== FIN DE L'EXTRAIT ===`;
}

// ------------------------------------------------------------
// 3. CLIENT GEMINI
// ------------------------------------------------------------
const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Modèle utilisé — "gemini-2.5-flash" est un bon compromis
// rapidité/coût/qualité pour un chatbot. Change ici si besoin.
const MODEL_NAME = 'gemini-3.1-flash-lite';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 10;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ------------------------------------------------------------
// 4. HANDLER POST
// ------------------------------------------------------------
export const POST: APIRoute = async ({ request }) => {
  if (!ai) {
    console.error('[api/chat] GEMINI_API_KEY manquante dans les variables d\'environnement.');
    return jsonResponse(
      { error: "Meuh... la clé API Gemini n'est pas configurée côté serveur." },
      500
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Requête invalide : JSON attendu.' }, 400);
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const rawHistory = Array.isArray(body?.history) ? body.history : [];

  if (!message) {
    return jsonResponse({ error: 'Le message est vide.' }, 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(
      { error: `Meuh, ton message est trop long (max ${MAX_MESSAGE_LENGTH} caractères).` },
      400
    );
  }

  // Historique de conversation -> format "contents" attendu par l'API Gemini
  const historyContents = rawHistory
    .slice(-MAX_HISTORY_TURNS)
    .filter((h: any) => h && typeof h.text === 'string' && h.text.trim())
    .map((h: any) => ({
      role: h.role === 'bot' ? 'model' : 'user',
      parts: [{ text: String(h.text).slice(0, 2000) }],
    }));

  const contents = [
    ...historyContents,
    { role: 'user', parts: [{ text: message }] },
  ];

  // On filtre la base d'outils selon la question posée (+ un peu
  // d'historique récent pour garder le contexte de la conversation),
  // au lieu d'envoyer les 300+ outils de la base complète.
  const historyText = rawHistory
    .slice(-3)
    .map((h: any) => (typeof h?.text === 'string' ? h.text : ''))
    .join(' ');
  const relevantTools = selectRelevantTools(`${message} ${historyText}`, enrichedTools);
  const systemInstruction = buildSystemInstruction(relevantTools);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });

    const reply =
      response.text?.trim() ||
      "Meuh... je n'ai pas réussi à formuler une réponse claire, tu peux reformuler ?";

    return jsonResponse({ reply });
  } catch (err) {
    console.error('[api/chat] Erreur lors de l\'appel à Gemini :', err);
    return jsonResponse(
      { error: "Meuh... la vache a glissé dans la boue en réfléchissant. Réessaie dans un instant !" },
      500
    );
  }
};