"use client";
import { useEffect, useRef } from "react";

/** Original "you need to restart" panic screen, triggered by `rm -rf /` in Terminal. */
export default function Panic({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <button ref={ref} type="button" className="os-panic" onClick={onDismiss} aria-label="Dismiss panic screen">
      <span className="os-panic-box">
        <span className="os-panic-power" aria-hidden>
          ⏻
        </span>
        <span>You need to restart your computer. Just kidding.</span>
        <span>Sie müssen den Computer neu starten. Nur ein Scherz.</span>
        <span>Vous devez redémarrer l&apos;ordinateur. Je plaisante.</span>
        <span>コンピュータを再起動する必要があります。冗談です。</span>
        <span className="os-panic-hint">Click anywhere to recover.</span>
      </span>
      <span className="os-panic-trace" aria-hidden>
        {`panic(cpu 0): rm -rf / detected, refusing politely
Backtrace: 0x0000dead 0x0000beef 0x00c0ffee
  shubh.portfolio.kernel: still employable
  com.sv.os.recruiter-safety-net: engaged`}
      </span>
    </button>
  );
}
