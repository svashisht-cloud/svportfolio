"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { prefersReducedMotion } from "./appMeta";

const BOOT_MS = 1200;
export const BOOT_KEY = "sv-os-booted";

/** True if this tab has already seen the boot screen (or storage is unavailable). */
export function hasBooted() {
  try {
    return window.sessionStorage.getItem(BOOT_KEY) === "1";
  } catch {
    return true;
  }
}

export function markBooted() {
  try {
    window.sessionStorage.setItem(BOOT_KEY, "1");
  } catch {
    // Ignore: without storage the boot screen just won't be remembered.
  }
}

/** Grey start-up screen: original SV mark, spinning gear, progress bar. ~1.2s, skippable. */
export function Boot({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      markBooted();
      onDone();
    };
    const t = window.setTimeout(finish, prefersReducedMotion() ? 0 : BOOT_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone]);

  return (
    <div className="os-boot" role="status" aria-label="Starting up">
      <div className="os-boot-mark" aria-hidden>
        SV
      </div>
      <p className="os-boot-name">SV OS X</p>
      <div className="os-boot-gear" aria-hidden />
      <div className="os-boot-progress" aria-hidden>
        <span style={{ animationDuration: `${BOOT_MS}ms` }} />
      </div>
      <button
        type="button"
        className="os-boot-skip"
        onClick={() => {
          if (done.current) return;
          done.current = true;
          markBooted();
          onDone();
        }}
      >
        Skip
      </button>
    </div>
  );
}

/** Aqua-style login panel. Only shown after "Log Out". */
export function Login({ onLogin, onShutDown }: { onLogin: () => void; onShutDown: () => void }) {
  const userRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    userRef.current?.focus();
  }, []);
  return (
    <div className="os-login" role="dialog" aria-label="Log in">
      <div className="os-login-panel">
        <div className="os-login-head">
          <span className="os-boot-mark os-boot-mark--small" aria-hidden>
            SV
          </span>
          <span>SV OS X</span>
        </div>
        <div className="os-login-body">
          <button ref={userRef} type="button" className="os-login-user" onClick={onLogin}>
            <Image src="/images/avatar.jpg" alt="" width={84} height={84} />
            <span>Shubh Vashisht</span>
          </button>
          <p className="os-meta">Click your picture to log in</p>
        </div>
        <div className="os-login-foot">
          <button type="button" className="aqua-btn" onClick={onShutDown}>
            Shut Down
          </button>
          <button type="button" className="aqua-btn aqua-btn--primary" onClick={onLogin}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
