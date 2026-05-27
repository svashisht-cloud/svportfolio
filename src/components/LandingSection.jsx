"use client";
import React, { useState } from "react";
import Image from "next/image";
import { FaLinkedin, FaGithub, FaYoutube, FaFileDownload, FaEnvelope } from "react-icons/fa";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
const BTN_PRIMARY = `px-4 py-2 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] hover:opacity-90 text-[#161616] font-semibold rounded-lg transition motion-reduce:transition-none ${FOCUS}`;
const BTN_SECONDARY = `px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-lg transition motion-reduce:transition-none ${FOCUS}`;

const LandingSection = ({ setIsMenuOpen }) => {
  const [showAboutMe, setShowAboutMe] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  return (
    <div className="relative w-full sm:w-4/5 h-[70vh] overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-md)]">
      {/* Top edge accent glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent z-10" />
      {/* Landing Content */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex flex-col items-center justify-center motion-reduce:transition-none ${
          showAboutMe || showSocials || showExperience || showEducation
            ? "-translate-x-full"
            : "translate-x-0"
        }`}
      >
        <Image
          src="/images/personal.png"
          alt=""
          width={200}
          height={300}
          className="w-32 sm:w-48 rounded-full object-cover mx-auto mt-2"
        />
        <h1 className="text-[var(--foreground)] text-center font-bold text-2xl sm:text-4xl mt-6 mx-4">
          Hey, my name is Shubh.
        </h1>
        <p className="text-[var(--muted)] mt-3 text-center mx-4 text-sm sm:text-base">
          Software engineer building AI products, distributed systems, and robotics platforms.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-center sm:gap-3 gap-1 text-xs text-[var(--muted)] text-center">
          <span>Full Stack Software</span>
          <span className="hidden sm:inline text-[var(--border)]">·</span>
          <span>AI products shipped</span>
          <span className="hidden sm:inline text-[var(--border)]">·</span>
          <span>Distributed systems</span>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="flex space-x-3">
            <button onClick={() => setShowAboutMe(true)} className={BTN_PRIMARY}>
              About Me
            </button>
            <button onClick={() => setShowSocials(true)} className={BTN_SECONDARY}>
              Socials
            </button>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`mt-4 lg:hidden ${BTN_SECONDARY}`}
          >
            Explore Projects
          </button>
        </div>
      </div>

      {/* About Me Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center motion-reduce:transition-none ${
          showAboutMe && !showExperience && !showEducation
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-6 rounded-xl max-w-md w-full">
          <h2 className="text-[var(--foreground)] text-2xl font-bold mb-3 text-center">
            About Me
          </h2>
          {/* Professional proof — leads */}
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
            Software engineer with 4+ years building production systems across AI, distributed robotics platforms, and full-stack web. I focus on developer tools, language model applications, and real-time infrastructure.
          </p>
          <div className="flex justify-center space-x-3 mb-4">
            <button onClick={() => setShowExperience(true)} className={BTN_PRIMARY}>
              Experience
            </button>
            <button onClick={() => setShowEducation(true)} className={BTN_SECONDARY}>
              Education
            </button>
          </div>
          {/* Quick facts — secondary, clearly separated */}
          <div className="border-t border-[var(--border)] pt-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">Quick facts</p>
            {[
              ["Born", "2000"],
              ["Eyes", "Brown"],
              ["Bench", "135 lbs"],
              ["Movies", "The Matrix, Rush Hour"],
            ].map(([k, v]) => (
              <p key={k} className="text-xs text-[var(--muted)]">
                <span className="text-[var(--text-dim)]">{k}</span> · {v}
              </p>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={() => setShowAboutMe(false)} className={BTN_SECONDARY}>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Experience Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center motion-reduce:transition-none ${
          showExperience ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-6 rounded-xl max-w-md w-full">
          <h2 className="text-[var(--foreground)] text-2xl font-bold mb-4 text-center">
            Experience
          </h2>
          <div className="w-full text-left">
            <Image
              src="/images/outrider.jpeg"
              alt="Outrider company logo"
              width={150}
              height={150}
              className="mx-auto mb-4 rounded-lg"
              style={{ height: "auto" }}
            />
            <p className="text-[var(--muted)] leading-relaxed text-sm">
              Over 3 years building production software — from AI-powered web products to distributed robotics platform systems. Specializing in real-time infrastructure, developer tooling, and full-stack development.
            </p>
          </div>
          <button
            onClick={() => setShowExperience(false)}
            className={`mt-5 ${BTN_SECONDARY}`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Education Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center motion-reduce:transition-none ${
          showEducation ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-6 rounded-xl max-w-md w-full">
          <h2 className="text-[var(--foreground)] text-2xl font-bold mb-4 text-center">
            Education
          </h2>
          <div className="w-full text-left">
            <Image
              src="/images/umass.png"
              alt="UMass Amherst logo"
              width={150}
              height={150}
              className="mx-auto mb-4 rounded-lg"
              style={{ height: "auto" }}
            />
            <p className="text-[var(--muted)] leading-relaxed text-sm">
              Bachelor&apos;s in Computer Science from the University of Massachusetts, Amherst — where I learned to build things that actually work, preferably on the first try.
            </p>
          </div>
          <button
            onClick={() => setShowEducation(false)}
            className={`mt-5 ${BTN_SECONDARY}`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Socials Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center motion-reduce:transition-none ${
          showSocials ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-6 rounded-xl max-w-md w-full">
          <h2 className="text-[var(--foreground)] text-2xl font-bold mb-4 text-center">
            Socials
          </h2>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.open("https://www.linkedin.com/in/shubh-vashisht/", "_blank")}
              className={`flex items-center justify-center space-x-2 ${BTN_PRIMARY}`}
            >
              <FaLinkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </button>
            <button
              onClick={() => window.open("https://github.com/shubh-vashisht", "_blank")}
              className={`flex items-center justify-center space-x-2 ${BTN_SECONDARY}`}
            >
              <FaGithub className="w-5 h-5" />
              <span>GitHub</span>
            </button>
            <button
              onClick={() => window.open("https://www.youtube.com/@shubhy4628", "_blank")}
              className={`flex items-center justify-center space-x-2 ${BTN_SECONDARY}`}
            >
              <FaYoutube className="w-5 h-5" />
              <span>YouTube</span>
            </button>
            <a
              href="/resume.pdf"
              download
              className={`flex items-center justify-center space-x-2 ${BTN_SECONDARY}`}
            >
              <FaFileDownload className="w-5 h-5" />
              <span>Download Resume</span>
            </a>
            <button
              onClick={() => setShowContact(true)}
              className={`flex items-center justify-center space-x-2 ${BTN_SECONDARY}`}
            >
              <FaEnvelope className="w-5 h-5" />
              <span>Contact Me</span>
            </button>
          </div>
          <button
            onClick={() => setShowSocials(false)}
            className={`mt-4 ${BTN_SECONDARY}`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-6 rounded-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 text-center text-[var(--foreground)]">
              Contact Me
            </h2>
            <p className="text-[var(--muted)] text-sm text-center mb-5">
              Send me an email and I&apos;ll get back to you.
            </p>
            <a
              href="mailto:nucaluregaming@gmail.com?subject=Hello from your portfolio"
              className={`flex items-center justify-center space-x-2 w-full ${BTN_PRIMARY}`}
            >
              <FaEnvelope className="w-4 h-4" />
              <span>Open Email</span>
            </a>
            <button
              onClick={() => setShowContact(false)}
              className={`mt-3 w-full ${BTN_SECONDARY}`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingSection;
