"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaEnvelope, FaPaperPlane, FaRedo, FaUser } from "react-icons/fa";
import { GREETING } from "@/app/knowledge";
import { prefersReducedMotion } from "../appMeta";
import { play } from "../sounds";
import { useWM, useWMState } from "../WindowManager";
import { askShubhGPT, type ChatTurn } from "./answer";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  /** Words revealed so far, for the word-by-word effect. */
  shown: number;
}

const SUGGESTIONS = [
  "What are you working on?",
  "What are your strongest skills?",
  "Tell me about your robotics work",
  "What's Arcfield?",
  "Where did you study?",
  "How can I reach you?",
];

const words = (t: string) => t.split(/(\s+)/);

/** The greeting is always message 0; later ids come from a per-chat counter. */
const greeting = (): Message => ({ id: 0, from: "bot", text: GREETING, shown: words(GREETING).length });

/** Chat with an early-2000s Mac messenger look. Scripted answers for now (see answer.ts). */
export default function ShubhGPT() {
  const wm = useWM();
  const { wins } = useWMState();
  const [messages, setMessages] = useState<Message[]>(() => [greeting()]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);
  // Bumped by "New chat" so a reply that arrives afterwards is dropped.
  const chatGen = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Reveal a bot message word by word. */
  const stream = (id: number, total: number) => {
    if (prefersReducedMotion()) {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, shown: total } : x)));
      return;
    }
    let shown = 0;
    const tick = () => {
      shown = Math.min(total, shown + 2);
      const n = shown;
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, shown: n } : x)));
      if (shown < total) later(28, tick);
    };
    tick();
  };

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || typing) return;
    play("click");
    setInput("");
    const userId = nextId.current++;
    const botId = nextId.current++;
    const gen = chatGen.current;
    setMessages((m) => [...m, { id: userId, from: "user", text: question, shown: 0 }]);
    setTyping(true);

    // The conversation so far (minus the greeting), plus the new question.
    const history: ChatTurn[] = [
      ...messages
        .filter((m) => m.id !== 0)
        .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text })),
      { role: "user", content: question },
    ];
    // Keep the typing dots up briefly even when the reply is instant (scripted fallback).
    const minWait = prefersReducedMotion() ? 0 : 600;
    const [{ text: reply }] = await Promise.all([
      askShubhGPT(history),
      new Promise((resolve) => window.setTimeout(resolve, minWait)),
    ]);
    if (gen !== chatGen.current) return; // "New chat" was pressed meanwhile

    setTyping(false);
    setMessages((m) => [...m, { id: botId, from: "bot", text: reply, shown: 0 }]);
    play("pop");
    stream(botId, words(reply).length);
  };

  const newChat = () => {
    chatGen.current += 1;
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setTyping(false);
    setMessages([greeting()]);
    setInput("");
    inputRef.current?.focus();
  };

  const emailShubh = () => {
    const lastUser = [...messages].reverse().find((m) => m.from === "user");
    const lastBot = [...messages].reverse().find((m) => m.from === "bot" && m.text !== GREETING);
    const body = lastUser
      ? `Hi Shubh,\n\nI asked ShubhGPT: "${lastUser.text}"\n${lastBot ? `It said: "${lastBot.text}"\n` : ""}\n`
      : "Hi Shubh,\n\n";
    // Mail fills its message only when it opens, so reopen it if it's already up.
    if (wins.some((w) => w.id === "contact")) {
      wm.close("contact");
      later(240, () => wm.launch("contact", { label: body }));
    } else {
      wm.launch("contact", { label: body });
    }
  };

  return (
    <div className="os-chat">
      <header className="os-chat-head">
        <Image src="/images/avatar.jpg" alt="" width={36} height={36} className="os-chat-avatar" />
        <div>
          <p className="os-chat-name">ShubhGPT</p>
          <p className="os-chat-status">
            <span className="os-chat-dot" aria-hidden /> Available · usually replies instantly
          </p>
        </div>
      </header>

      <div className="os-chat-list" ref={listRef} role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className={`os-chat-row os-chat-row--${m.from}`}>
            {m.from === "bot" ? (
              <Image src="/images/avatar.jpg" alt="" width={30} height={30} className="os-chat-avatar os-chat-avatar--small" />
            ) : (
              <span className="os-chat-avatar os-chat-avatar--small os-chat-avatar--you" aria-hidden>
                <FaUser />
              </span>
            )}
            <p className="os-bubble">
              <span className="os-sr-only">{m.from === "bot" ? "ShubhGPT: " : "You: "}</span>
              {m.from === "bot" ? words(m.text).slice(0, m.shown).join("") : m.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="os-chat-row os-chat-row--bot">
            <Image src="/images/avatar.jpg" alt="" width={30} height={30} className="os-chat-avatar os-chat-avatar--small" />
            <p className="os-bubble os-bubble--typing" aria-label="ShubhGPT is typing">
              <span />
              <span />
              <span />
            </p>
          </div>
        )}
      </div>

      <div className="os-chat-chips" aria-label="Suggested questions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="os-chip" onClick={() => void ask(s)} disabled={typing}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="os-chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <textarea
          ref={inputRef}
          data-autofocus
          rows={1}
          value={input}
          maxLength={500}
          placeholder="Ask about Shubh's work…"
          aria-label="Your question"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(input);
            }
          }}
        />
        <button type="submit" className="aqua-btn aqua-btn--primary" disabled={!input.trim() || typing}>
          <FaPaperPlane aria-hidden /> Send
        </button>
      </form>

      <footer className="os-chat-foot">
        <button type="button" className="aqua-btn" onClick={emailShubh}>
          <FaEnvelope aria-hidden /> Email Shubh about this
        </button>
        <button type="button" className="aqua-btn" onClick={newChat}>
          <FaRedo aria-hidden /> New chat
        </button>
      </footer>
    </div>
  );
}
