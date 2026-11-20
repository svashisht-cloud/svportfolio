"use client";
import Image from "next/image";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEnvelope,
  FaFilePdf,
  FaGithub,
  FaImage,
  FaInfoCircle,
  FaLinkedin,
  FaPowerOff,
  FaQuestion,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaTrophy,
  FaVolumeUp,
  FaYoutube,
  FaCog,
  FaCheck,
} from "react-icons/fa";
import { LINKS } from "./appMeta";
import { emit } from "./eggs/bus";
import { WALLPAPERS, setPrefs, useEffectiveTheme, usePrefs, type Appearance } from "./prefs";
import { play } from "./sounds";
import { useWM } from "./WindowManager";

/**
 * Phones: the Settings app (the `prefs` window). An iOS-style grouped list; rows either act
 * right away (switches, links, apps) or slide to a sub-page (Display, Wallpaper, General).
 */

type Page = "root" | "display" | "wallpaper" | "general";

const TITLES: Record<Page, string> = {
  root: "Settings",
  display: "Display & Brightness",
  wallpaper: "Wallpaper",
  general: "General",
};

function Glyph({ icon: Icon, color }: { icon: IconType; color: string }) {
  return (
    <span className="os-set-glyph" style={{ background: color }} aria-hidden>
      <Icon />
    </span>
  );
}

function Row({
  icon,
  color,
  label,
  detail,
  onClick,
  chevron = true,
  danger = false,
  children,
}: {
  icon?: IconType;
  color?: string;
  label: string;
  detail?: string;
  onClick?: () => void;
  chevron?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      {icon && color && <Glyph icon={icon} color={color} />}
      <span className={`os-set-label${danger ? " is-danger" : ""}`}>{label}</span>
      {detail && <span className="os-set-detail">{detail}</span>}
      {children}
      {onClick && chevron && <FaChevronRight className="os-set-chevron" aria-hidden />}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" className="os-set-row" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="os-set-row">{body}</div>
      )}
    </li>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`os-switch${on ? " is-on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  );
}

const openTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

function downloadResume() {
  const a = document.createElement("a");
  a.href = "/resume.pdf";
  a.download = "";
  a.click();
}

export default function PhoneSettings() {
  const wm = useWM();
  const prefs = usePrefs();
  const theme = useEffectiveTheme();
  const [page, setPage] = useState<Page>("root");

  const sound = (
    <Switch
      label="Sounds"
      on={prefs.sound}
      onChange={(v) => {
        setPrefs({ sound: v });
        if (v) window.setTimeout(() => play("click"), 0);
      }}
    />
  );

  return (
    <div className="os-set" data-page={page}>
      {page !== "root" && (
        <button type="button" className="os-set-back" onClick={() => setPage("root")}>
          <FaChevronLeft aria-hidden /> Settings
        </button>
      )}
      <h1 className="os-set-title">{TITLES[page]}</h1>

      {page === "root" && (
        <div className="os-set-page" key="root">
          <ul className="os-set-group">
            <li>
              <button type="button" className="os-set-row os-set-profile" onClick={() => wm.launch("sysinfo")}>
                <Image src="/images/avatar.jpg" alt="" width={58} height={58} className="os-set-avatar" />
                <span className="os-set-label">
                  Shubh Vashisht
                  <small>Software Engineer · About This Developer</small>
                </span>
                <FaChevronRight className="os-set-chevron" aria-hidden />
              </button>
            </li>
          </ul>
          <ul className="os-set-group">
            <Row icon={FaSun} color="#2f7cf6" label="Display & Brightness" detail={theme === "dark" ? "Dark" : "Light"} onClick={() => setPage("display")} />
            <Row icon={FaImage} color="#33b5e5" label="Wallpaper" onClick={() => setPage("wallpaper")} />
            <Row icon={FaVolumeUp} color="#f0466a" label="Sounds">
              {sound}
            </Row>
          </ul>
          <ul className="os-set-group">
            <Row icon={FaCog} color="#8e8e93" label="General" onClick={() => setPage("general")} />
            <Row icon={FaSyncAlt} color="#34c759" label="Software Update" onClick={() => wm.launch("update")} />
            <Row icon={FaTrophy} color="#f5a623" label="Trophies" onClick={() => wm.launch("achievements")} />
          </ul>
          <ul className="os-set-group">
            <Row icon={FaFilePdf} color="#e5483f" label="View Résumé" onClick={() => wm.launch("resume")} />
            <Row icon={FaDownload} color="#5856d6" label="Download Résumé" chevron={false} onClick={downloadResume} />
          </ul>
          <ul className="os-set-group">
            <Row icon={FaEnvelope} color="#34c759" label="Mail Me" onClick={() => wm.launch("contact")} />
            <Row icon={FaGithub} color="#24292f" label="GitHub" chevron={false} onClick={() => openTab(LINKS.github)} />
            <Row icon={FaLinkedin} color="#0a66c2" label="LinkedIn" chevron={false} onClick={() => openTab(LINKS.linkedin)} />
            <Row icon={FaYoutube} color="#ff0000" label="YouTube" chevron={false} onClick={() => openTab(LINKS.youtube)} />
          </ul>
          <ul className="os-set-group">
            <Row icon={FaSyncAlt} color="#8e8e93" label="Restart" chevron={false} onClick={() => emit("power", "restart")} />
            <Row icon={FaPowerOff} color="#8e8e93" label="Shut Down" chevron={false} onClick={() => emit("power", "shutdown")} />
            <Row icon={FaSignOutAlt} color="#ff3b30" label="Log Out Shubh" danger chevron={false} onClick={() => emit("power", "logout")} />
          </ul>
        </div>
      )}

      {page === "display" && (
        <div className="os-set-page" key="display">
          <p className="os-set-caption">Appearance</p>
          <ul className="os-set-group">
            <li className="os-set-modes">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`os-set-mode${theme === t ? " is-on" : ""}`}
                  aria-pressed={theme === t}
                  onClick={() => setPrefs({ theme: t })}
                >
                  <span className={`os-set-mode-preview os-set-mode-preview--${t}`} aria-hidden />
                  {t === "light" ? "Light" : "Dark"}
                  <span className="os-set-radio" aria-hidden>
                    {theme === t && <FaCheck />}
                  </span>
                </button>
              ))}
            </li>
            <Row label="Automatic">
              <Switch
                label="Automatic appearance"
                on={prefs.theme === "system"}
                onChange={(v) => setPrefs({ theme: v ? "system" : theme })}
              />
            </Row>
          </ul>
          <p className="os-set-caption">Accent</p>
          <ul className="os-set-group">
            {(["blue", "graphite"] as Appearance[]).map((a) => (
              <Row key={a} label={a === "blue" ? "Blue" : "Graphite"} chevron={false} onClick={() => setPrefs({ appearance: a })}>
                {prefs.appearance === a && <FaCheck className="os-set-check" aria-hidden />}
              </Row>
            ))}
          </ul>
          <p className="os-set-note">Saved in this browser.</p>
        </div>
      )}

      {page === "wallpaper" && (
        <div className="os-set-page" key="wallpaper">
          <ul className="os-set-walls" role="radiogroup" aria-label="Wallpaper">
            {WALLPAPERS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={prefs.wallpaper === w.id}
                  className="os-set-wall"
                  onClick={() => setPrefs({ wallpaper: w.id })}
                >
                  <span className="os-wall-swatch os-wallpaper" data-wallpaper={w.id} aria-hidden />
                  <span>{w.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {page === "general" && (
        <div className="os-set-page" key="general">
          <ul className="os-set-group">
            <Row icon={FaInfoCircle} color="#8e8e93" label="About This Site" onClick={() => wm.launch("info")} />
            <Row icon={FaQuestion} color="#2f7cf6" label="Help" onClick={() => wm.launch("help")} />
          </ul>
          <ul className="os-set-group">
            <Row label="Console" onClick={() => wm.launch("console")} />
            <Row label="Activity Monitor" onClick={() => wm.launch("activity")} />
            <Row label="Classic Environment" detail="Old portfolio" onClick={() => wm.launch("classic")} />
          </ul>
        </div>
      )}
    </div>
  );
}
