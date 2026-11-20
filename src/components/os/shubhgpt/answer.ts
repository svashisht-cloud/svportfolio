import { log } from "../syslog";
import { FALLBACK, KNOWLEDGE, type KnowledgeEntry } from "@/app/knowledge";

export interface Answer {
  text: string;
  /** Knowledge entries the answer came from (empty for small talk / fallback). */
  sourceIds: string[];
}

const GREET = /^(hi|hey|hello|yo|sup|hiya|good (morning|afternoon|evening))\b/;
const THANKS = /\b(thanks|thank you|thx|cheers)\b/;

/**
 * Easter egg for the offline fallback only. When the model is available it answers
 * these questions itself from the personal fact in the route's system prompt.
 */
const GF = /\b(girl ?friends?|gf|wifey|dating|in a relationship|seeing (anyone|someone)|are you (single|taken))\b/i;
const GF_ANSWER =
  "Ah, the important question! 💕 My girlfriend is Riya Bharamaraddi, from Dallas, Texas. Now, back to business: want to hear about my projects?";

export function easterEgg(question: string): Answer | null {
  return GF.test(question) ? { text: GF_ANSWER, sourceIds: [] } : null;
}

/**
 * Scripted answers until the real model is connected: score every knowledge entry
 * by how many of its keywords appear in the question, and answer with the best one.
 * Later this becomes a call to /api/shubhgpt that sends KNOWLEDGE to Claude.
 */
export function answer(question: string): Answer {
  const egg = easterEgg(question);
  if (egg) return egg;
  const q = ` ${question.toLowerCase().replace(/[^\p{L}\p{N}+#.\s-]/gu, " ").replace(/\s+/g, " ").trim()} `;

  if (GREET.test(q.trim()) && q.trim().split(" ").length <= 3) {
    return { text: "Hi! What would you like to know? My work, projects, skills or how to reach me are all fair game.", sourceIds: [] };
  }
  if (THANKS.test(q)) {
    return { text: "Any time! If you want to keep talking, the Email Shubh button goes straight to my inbox.", sourceIds: [] };
  }

  const score = (e: KnowledgeEntry) =>
    e.keywords.reduce((sum, k) => {
      if (!k) return sum;
      // Whole words only (so "tell me about you" doesn't match "...about your robotics").
      const hit = q.includes(` ${k} `) || q.includes(` ${k}s `);
      return hit ? sum + (k.includes(" ") ? 2 : 1) : sum;
    }, 0);

  const ranked = KNOWLEDGE.map((e) => ({ e, s: score(e) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!ranked.length) return { text: FALLBACK, sourceIds: [] };

  // Add a closely-related second entry when it scores nearly as well.
  const [first, second] = ranked;
  const picks = second && second.s >= first.s && second.e.id !== first.e.id ? [first.e, second.e] : [first.e];
  return { text: picks.map((e) => e.text).join("\n\n"), sourceIds: picks.map((e) => e.id) };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ask the real model via /api/shubhgpt. Falls back to the scripted answer when the
 * route isn't configured (no OPENAI_API_KEY), is down, or the visitor is rate-limited.
 */
export async function askShubhGPT(history: ChatTurn[]): Promise<Answer & { live: boolean }> {
  const question = history[history.length - 1]?.content ?? "";
  const started = performance.now();
  const took = () => `${Math.round(performance.now() - started)} ms`;
  try {
    const res = await fetch("/api/shubhgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    if (res.status === 429) {
      log("ShubhGPT", `POST /api/shubhgpt 429 (rate limited) in ${took()}`, "warn");
      return {
        text: "You've asked me a lot in a short time! Give it a little while, or use the Email Shubh button and I'll reply properly.",
        sourceIds: [],
        live: false,
      };
    }
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { text?: string };
    if (!data.text) throw new Error("empty");
    log("ShubhGPT", `POST /api/shubhgpt 200 in ${took()}`);
    return { text: data.text, sourceIds: [], live: true };
  } catch (err) {
    log("ShubhGPT", `live model unavailable (${err instanceof Error ? err.message : "error"}); scripted answer`, "warn");
    return { ...answer(question), live: false };
  }
}
