import { FALLBACK, KNOWLEDGE, type KnowledgeEntry } from "@/app/knowledge";

export interface Answer {
  text: string;
  /** Knowledge entries the answer came from (empty for small talk / fallback). */
  sourceIds: string[];
}

const GREET = /^(hi|hey|hello|yo|sup|hiya|good (morning|afternoon|evening))\b/;
const THANKS = /\b(thanks|thank you|thx|cheers)\b/;

/**
 * Scripted answers until the real model is connected: score every knowledge entry
 * by how many of its keywords appear in the question, and answer with the best one.
 * Later this becomes a call to /api/shubhgpt that sends KNOWLEDGE to Claude.
 */
export function answer(question: string): Answer {
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
