"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { banner, complete, run, type CommandResult, type FollowUp, type TermLine } from "./commands";
import { on } from "./eggs/bus";
import { log } from "./syslog";
import { unlock } from "./achievements";
import MatrixRain from "./eggs/MatrixRain";
import { useMusic } from "./Music";
import { useWM } from "./WindowManager";

/** When the page was loaded, for the banner's "uptime". */
const PAGE_START = typeof window !== "undefined" ? Date.now() : 0;

/** `label` replaces the shell prompt for answers to a follow-up (e.g. "Password:" or ">"). */
type Entry = { kind: "out"; line: TermLine } | { kind: "cmd"; text: string; label?: string };

const PROMPT_USER = "shubh@portfolio";

function Prompt() {
  return (
    <span className="os-term-prompt">
      <span className="os-term-user">{PROMPT_USER}</span> <span className="os-term-path">~</span> %{" "}
    </span>
  );
}

/**
 * `initialCommand` runs as soon as the window opens; commands sent over the bus ("terminal",
 * from Spotlight) run while it's open, as if typed.
 */
export default function Terminal({ initialCommand }: { initialCommand?: string }) {
  const wm = useWM();
  const music = useMusic();
  const [entries, setEntries] = useState<Entry[]>(() =>
    banner(PAGE_START).map((line) => ({ kind: "out", line })),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState<FollowUp>();
  // The avatar sits beside the start-up banner until the screen is cleared.
  const [showAvatar, setShowAvatar] = useState(true);
  const [matrix, setMatrix] = useState(false);
  const stopMatrix = useCallback(() => setMatrix(false), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the prompt in view by scrolling only the Terminal's own window body
  // (scrollIntoView would also scroll the desktop when the window hangs off-screen).
  useEffect(() => {
    const body = endRef.current?.closest(".os-window-body");
    if (body) body.scrollTop = body.scrollHeight;
  }, [entries]);

  const append = (result: CommandResult, echo: Entry) => {
    if (result.clear) setShowAvatar(false);
    if (result.matrix) setMatrix(true);
    setEntries((prev) => [
      ...(result.clear ? [] : [...prev, echo]),
      ...result.lines.map((line) => ({ kind: "out" as const, line })),
    ]);
    setFollowUp(result.prompt);
  };

  const submit = () => {
    const text = input;
    setInput("");
    setHistIndex(null);
    if (followUp) {
      append(followUp.handle(text), {
        kind: "cmd",
        text: followUp.masked ? "" : text,
        label: followUp.label,
      });
      return;
    }
    runCommand(text);
  };

  /** Run a shell command as if it had been typed. Ends any follow-up (sudo, adventure). */
  const runCommand = (text: string) => {
    if (text.trim()) {
      log("Terminal", `$ ${text.trim()}`);
      unlock("hello");
    }
    const nextHistory = text.trim() ? [...history, text.trim()] : history;
    setHistory(nextHistory);
    append(
      run(text, {
        launch: wm.launch,
        history: nextHistory,
        startedAt: PAGE_START,
        music: {
          index: music.index,
          playing: music.playing,
          time: music.time,
          play: music.play,
          pause: music.pause,
          next: music.next,
        },
      }),
      { kind: "cmd", text },
    );
  };

  const runRef = useRef(runCommand);
  useEffect(() => {
    runRef.current = runCommand;
  });
  const ranInitial = useRef(false);
  useEffect(() => {
    if (!initialCommand || ranInitial.current) return;
    const t = window.setTimeout(() => {
      ranInitial.current = true;
      runRef.current(initialCommand);
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialCommand]);
  useEffect(
    () =>
      on("terminal", (cmd) => {
        if (cmd) runRef.current(cmd);
      }),
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!followUp) setInput((v) => complete(v));
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
      setShowAvatar(false);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setEntries((prev) => [...prev, { kind: "cmd", text: `${input}^C` }]);
      setInput("");
      setFollowUp(undefined);
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
      {matrix && <MatrixRain onDone={stopMatrix} />}
      {showAvatar && (
        <Image
          src="/images/avatar.jpg"
          alt=""
          width={72}
          height={72}
          className="os-term-avatar"
        />
      )}
      <div role="log" aria-live="polite" aria-label="Terminal output">
        {entries.map((entry, i) =>
          entry.kind === "cmd" ? (
            <div key={i} className="os-term-row">
              {entry.label ? <span>{entry.label}&nbsp;</span> : <Prompt />}
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
        {followUp ? <span>{followUp.label}&nbsp;</span> : <Prompt />}
        <input
          ref={inputRef}
          className="os-term-input"
          type={followUp?.masked ? "password" : "text"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          data-autofocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={followUp ? (followUp.masked ? "Password" : "Answer") : "Command"}
        />
      </div>
    </div>
  );
}
