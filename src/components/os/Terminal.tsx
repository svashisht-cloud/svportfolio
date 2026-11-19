"use client";
import { useEffect, useRef, useState } from "react";
import { banner, complete, run, type CommandResult, type TermLine } from "./commands";
import { useWM } from "./WindowManager";

/** When the page was loaded, for the banner's "uptime". */
const PAGE_START = typeof window !== "undefined" ? Date.now() : 0;

type Entry = { kind: "out"; line: TermLine } | { kind: "cmd"; text: string; masked?: boolean };

const PROMPT_USER = "shubh@portfolio";

function Prompt() {
  return (
    <span className="os-term-prompt">
      <span className="os-term-user">{PROMPT_USER}</span> <span className="os-term-path">~</span> %{" "}
    </span>
  );
}

export default function Terminal() {
  const wm = useWM();
  const [entries, setEntries] = useState<Entry[]>(() =>
    banner(PAGE_START).map((line) => ({ kind: "out", line })),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const [password, setPassword] = useState<CommandResult["password"]>();
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  const append = (result: CommandResult, echo: Entry) => {
    setEntries((prev) => [
      ...(result.clear ? [] : [...prev, echo]),
      ...result.lines.map((line) => ({ kind: "out" as const, line })),
    ]);
    setPassword(() => result.password);
  };

  const submit = () => {
    const text = input;
    setInput("");
    setHistIndex(null);
    if (password) {
      append(password(text), { kind: "cmd", text: "", masked: true });
      return;
    }
    const nextHistory = text.trim() ? [...history, text.trim()] : history;
    setHistory(nextHistory);
    append(
      run(text, { launch: wm.launch, history: nextHistory, startedAt: PAGE_START }),
      { kind: "cmd", text },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!password) setInput((v) => complete(v));
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const i = histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown" && histIndex !== null) {
      e.preventDefault();
      const i = histIndex + 1;
      if (i >= history.length) {
        setHistIndex(null);
        setInput("");
      } else {
        setHistIndex(i);
        setInput(history[i]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setEntries((prev) => [...prev, { kind: "cmd", text: `${input}^C` }]);
      setInput("");
      setPassword(undefined);
    }
  };

  return (
    <div
      className="os-term os-terminal"
      onPointerUp={() => {
        // Clicking anywhere focuses the prompt, unless the user is selecting text.
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
    >
      <div role="log" aria-live="polite" aria-label="Terminal output">
        {entries.map((entry, i) =>
          entry.kind === "cmd" ? (
            <div key={i} className="os-term-row">
              {entry.masked ? <span>Password:</span> : <Prompt />}
              <span>{entry.text}</span>
            </div>
          ) : (
            <div key={i} className={`os-term-row${entry.line.tone ? ` tone-${entry.line.tone}` : ""}`}>
              {entry.line.href ? (
                <a href={entry.line.href} target="_blank" rel="noopener noreferrer">
                  {entry.line.text}
                </a>
              ) : (
                entry.line.text || " "
              )}
            </div>
          ),
        )}
      </div>
      <div className="os-term-row os-term-input-row" ref={endRef}>
        {password ? <span>Password:&nbsp;</span> : <Prompt />}
        <input
          ref={inputRef}
          className="os-term-input"
          type={password ? "password" : "text"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          data-autofocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={password ? "Password" : "Command"}
        />
      </div>
    </div>
  );
}
