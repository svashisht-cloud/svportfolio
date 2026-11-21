import { experiences, isCurrentRole, projects } from "./portfolioData";

/**
 * What ShubhGPT knows: short first-person entries built only from facts already on
 * this site (portfolio data, About, Education, links). When the real model is
 * connected, these entries are sent to it as context; for now `answer()` picks
 * the best match by keywords.
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  text: string;
  /** Words and phrases that point to this entry (lowercase). */
  keywords: string[];
}

const EMAIL = "shubhv2@gmail.com";
const LINKS = {
  github: "https://github.com/svashisht-cloud",
  linkedin: "https://www.linkedin.com/in/shubh-vashisht/",
  youtube: "https://www.youtube.com/@shubhy_vashisht",
  topmate: "https://topmate.io/shubhvashisht",
};

const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function skillCounts(): [string, number][] {
  const counts = new Map<string, number>();
  const add = (tags?: string[]) => tags?.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  projects.forEach((p) => add(p.techStack));
  experiences.forEach((e) => e.roles.forEach((r) => r.projects.forEach((w) => add(w.techStack))));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function roleEntries(): KnowledgeEntry[] {
  const out: KnowledgeEntry[] = [];
  for (const exp of experiences) {
    const roles = [...exp.roles].reverse();
    roles.forEach((role) => {
      const current = isCurrentRole(role);
      const work = role.projects.map((w) => w.name);
      out.push({
        id: `role-${role.title.toLowerCase().replace(/\W+/g, "-")}`,
        title: `${role.title} at ${exp.company}`,
        text:
          `${current ? "Right now I'm" : "I was"} a ${role.title} at ${exp.company} (${role.dateRange}). ` +
          `${current ? "There I work on" : "There I worked on"} ${list(work)}. ${role.projects[0]?.description ?? ""}`,
        keywords: [
          role.title.toLowerCase(),
          exp.company.toLowerCase(),
          ...(current ? ["current", "now", "currently", "today", "working on", "job", "day job"] : []),
          ...(role.title.toLowerCase().includes("intern") ? ["intern", "internship", "first job"] : []),
          ...new Set(
            role.projects.flatMap((w) => [w.name.toLowerCase(), ...(w.techStack ?? []).map((t) => t.toLowerCase())]),
          ),
        ],
      });
    });
  }
  return out;
}

function projectEntries(): KnowledgeEntry[] {
  // Arcfield has its own hand-written entry below.
  return projects
    .filter((p) => p.name !== "Arcfield")
    .map((p) => ({
    id: `project-${p.name.toLowerCase().replace(/\W+/g, "-")}`,
    title: p.name,
    text:
      `${p.name} is one of my projects${p.role ? ` (${p.role.toLowerCase()})` : ""}. ${p.description}` +
      (p.highlights?.length ? ` Highlights: ${list(p.highlights)}.` : "") +
      (p.projectUrl ? ` You can see it at ${p.projectUrl}.` : p.codeUrl ? ` The code is at ${p.codeUrl}.` : ""),
    // Deduplicated, so a project name doesn't count twice.
    keywords: [
      ...new Set([
        p.name.toLowerCase(),
        ...p.name.toLowerCase().split(/\W+/).filter((w) => w.length > 3),
        ...(p.techStack ?? []).map((t) => t.toLowerCase()),
      ]),
    ],
  }));
}

const top = skillCounts().slice(0, 8).map(([name]) => name);

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "about",
    title: "About me",
    text:
      "I'm Shubh, a software engineer with 4+ years building production systems across AI, distributed robotics platforms and full-stack web. " +
      "I focus on developer tools, language model applications and real-time infrastructure.",
    keywords: ["who are you", "about you", "yourself", "introduce", "background", "summary", "who is shubh", "tell me about you"],
  },
  {
    id: "robotics",
    title: "Robotics work",
    text:
      "Most of my professional work has been on robotics platforms at Outrider (autonomous yard trucks): " +
      "event-triggered LiDAR recording, live ROS log streaming and filtering, mission-bag upload to S3, fleet operations dashboards, " +
      "a browser-based 3D yard view, onboard runtime service management in C++ on Linux, and configuration verification in Buildroot.",
    keywords: ["robot", "robotics", "ros", "autonomous", "autonomy", "fleet", "truck", "lidar", "telemetry", "c++"],
  },
  {
    id: "arcfield",
    title: "Arcfield",
    text:
      "Arcfield is my freelance practice: fleet software for robotics teams. I build the ops dashboards, live telemetry and log pipelines " +
      "robots need in the field, so autonomy engineers can stay focused on autonomy. The site has a simulated fleet dashboard you can try: https://arcfield-autonomy.vercel.app/",
    keywords: ["arcfield", "freelance", "consulting", "hire you for", "side business", "services"],
  },
  {
    id: "skills",
    title: "Skills",
    text:
      `The tools I've used most across my work and projects are ${list(top)}. ` +
      "My work spans backend services and data pipelines, real-time streaming, and the web dashboards built on top of them.",
    keywords: ["skill", "skills", "strongest", "stack", "tech", "technologies", "languages", "good at", "strengths", "expertise"],
  },
  {
    id: "education",
    title: "Education",
    text:
      "I studied Computer Science at the University of Massachusetts Amherst and earned my bachelor's degree (Aug 2019 – Dec 2022), finishing a month ahead of schedule.",
    keywords: ["study", "studied", "school", "college", "university", "umass", "amherst", "degree", "education", "graduate", "graduated"],
  },
  {
    id: "contact",
    title: "Contact",
    text: `The best way to reach me is email: ${EMAIL}. You can also find me on GitHub (${LINKS.github}), LinkedIn (${LINKS.linkedin}) and YouTube (${LINKS.youtube}). To book a 1:1 call with me, use Topmate (${LINKS.topmate}).`,
    keywords: ["contact", "reach", "email", "mail", "linkedin", "github", "youtube", "get in touch", "talk to you", "connect", "topmate", "call", "book", "meeting", "1:1", "mentorship"],
  },
  {
    id: "resume",
    title: "Résumé",
    text: "You can read my résumé right here: open Résumé.pdf on the desktop, or download it from /resume.pdf.",
    keywords: ["resume", "résumé", "cv"],
  },
  {
    id: "fun",
    title: "Fun facts",
    text: "A few fun facts: I was born in 2000, I bench 135 lbs, and my favourite movies are The Matrix and Rush Hour.",
    keywords: ["fun", "hobby", "hobbies", "movie", "movies", "bench", "gym", "born", "age", "personal"],
  },
  {
    id: "site",
    title: "This site",
    text:
      "This portfolio is a little Mac OS X–style desktop I built with Next.js, React and TypeScript, with all the styling hand-written in CSS. " +
      "There are a few secrets hidden around it, too.",
    keywords: ["this site", "website", "portfolio", "built this", "how was this made", "secret", "easter egg"],
  },
  ...roleEntries(),
  ...projectEntries(),
];

export const GREETING =
  "Hi! I'm ShubhGPT. Ask me anything about Shubh's work, projects, skills or background, and I'll answer as Shubh.";

export const FALLBACK =
  "I'm still learning that one. Email me with the button below and you'll get a real answer.";
