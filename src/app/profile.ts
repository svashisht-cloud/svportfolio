/**
 * Recruiter-facing facts for About Me.txt (At a glance), About This Developer and System Report.
 * Everything here comes from public/resume.pdf (see resumeText.ts). Unknowns stay visible as
 * {{TODO}} until Shubh fills them in: never guess them.
 */
export const profile = {
  name: "Shubh Vashisht",
  headline: "Software Engineer — Robotics & Autonomy Infrastructure",
  location: "Boston, MA",
  /** What Shubh is open to (roles, location, start date). */
  status: "Open to my next exciting project",
  previously: "Nearly 4 years at Outrider, building software for autonomous yard trucks",
  education: "B.S. Computer Science, UMass Amherst (Dec 2022)",
};

export interface Impact {
  from: string;
  to: string;
  label: string;
  where: string;
}

/** The résumé's before → after numbers, strongest first. */
export const impact: Impact[] = [
  { from: "3–4 h", to: "~5 min", label: "to debug a LiDAR incident", where: "Outrider" },
  { from: "5–10 min", to: "seconds", label: "to get a truck's logs", where: "Outrider" },
  { from: "$0.10", to: "$0.02", label: "LLM cost per résumé", where: "Forte" },
  { from: "~70%", to: "95–97%", label: "yard-inventory accuracy on slanted spots", where: "Outrider" },
  { from: "~60k", to: "~5k", label: "points rendered in the 3D yard view", where: "Outrider" },
];
