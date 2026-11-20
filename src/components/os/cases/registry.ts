/**
 * Case Files: 60-second puzzles built from résumé bullets, each ending on what really happened.
 * `facts` and `story` use only what's in public/resume.pdf (src/app/resumeText.ts). The puzzles
 * themselves are simplified simulations with generic names, and say so in their `tag`.
 *
 * To add a case: add an entry here, a component in this folder that takes `{ onSolved }`,
 * and a line in GAMES (CaseApp.tsx). Give it an icon in appMeta.tsx (`case:<id>`).
 */

export interface CaseFact {
  /** The "before" number, shown struck through. */
  from?: string;
  to: string;
  label: string;
}

export interface CaseFile {
  id: string;
  title: string;
  /** Shown in the window header, e.g. "SIMULATED LiDAR". */
  tag: string;
  /** One line for the folder, Spotlight and the Terminal. */
  tagline: string;
  /** The related work item in portfolioData (exact name). */
  work: string;
  company: string;
  facts: CaseFact[];
  /** "How I built it", first person, in the résumé's words. */
  story: string[];
  /** Suggested follow-up for ShubhGPT. */
  question: string;
}

export const CASES: CaseFile[] = [
  {
    id: "incident-replay",
    title: "Incident Replay",
    tag: "SIMULATED LiDAR",
    tagline: "A yard truck stopped. Find the scan that explains why.",
    work: "Event-Triggered LiDAR Recording",
    company: "Outrider",
    facts: [
      { from: "3–4 h", to: "~5 min", label: "to debug a LiDAR incident" },
      { to: "30 s + 30 s", label: "kept around each event, LZ4-compressed" },
    ],
    story: [
      "Recording full missions would have meant 20–30 GB of LiDAR data a minute. Instead I built event-triggered recording into the ROS bagger: an in-memory 30-second ring buffer, flushed when any config-registered event fires, plus the next 30 seconds, LZ4-compressed.",
      "Engineers could open an incident in Foxglove in about 5 minutes. Reproducing it in simulation used to take 3–4 hours.",
    ],
    question: "How did your event-triggered LiDAR recording work?",
  },
  {
    id: "boot-order",
    title: "Boot Order",
    tag: "SIMULATED BOOT",
    tagline: "A truck was just reprogrammed. Where should the compatibility check run?",
    work: "Configuration Verification & State Machine Infrastructure",
    company: "Outrider",
    facts: [
      { to: "Before ROS", label: "where the check runs, in Buildroot" },
      { to: "~1 week", label: "to design and deliver it" },
    ],
    story: [
      "I designed on-truck configuration verification that runs in Buildroot right after reprogramming, before ROS starts, to catch incompatible service images.",
      "I made the case for that placement over a ROS service, and delivered it in about a week.",
    ],
    question: "Why did you run the configuration check in Buildroot instead of as a ROS service?",
  },
  {
    id: "point-cloud-diet",
    title: "Point Cloud Diet",
    tag: "SIMULATED POINT CLOUD",
    tagline: "The browser yard view is choking. How many points can you cut and still see the yard?",
    work: "Browser-Based 3D Visualization System",
    company: "Outrider",
    facts: [
      { from: "~60k", to: "~5k", label: "points rendered, and still smooth" },
      { from: "5–10 min", to: "seconds", label: "to open the yard view instead of RViz" },
    ],
    story: [
      "I proposed and built an in-browser Three.js 3D yard view (truck pose, point clouds, containers) that replaced a 5–10 minute RViz startup with a view that loads in seconds.",
      "To keep it smooth, I reduced the rendered point clouds from ~60k to ~5k points.",
    ],
    question: "How did you make the 3D yard view load in seconds instead of minutes?",
  },
  {
    id: "slanted-spots",
    title: "Slanted Spots",
    tag: "SIMULATED YARD SCAN",
    tagline: "Yard inventory keeps misreading trailers on angled spots. Find out why.",
    work: "Yard Inventory Accuracy on Slanted Spots",
    company: "Outrider",
    facts: [
      { from: "~70%", to: "95–97%", label: "inventory accuracy on slanted spots" },
      { to: "CV model", label: "where the last errors were, once geometry was fixed" },
    ],
    story: [
      "At a production customer yard, inventory accuracy on slanted parking spots was around 70%. I traced the misreads to capture geometry and introduced offset-based capture, which raised it to 95–97%.",
      "I isolated the remaining errors to the CV model.",
    ],
    question: "How did you track down the yard-inventory misreads on slanted spots?",
  },
];

export const caseById = (id?: string) => CASES.find((c) => c.id === id);

/** The case file about a work item, if there is one. */
export const caseForWork = (workName?: string) => CASES.find((c) => c.work === workName);
