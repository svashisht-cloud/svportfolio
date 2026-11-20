import { experiences, projects, type Project, type Role, type WorkProject } from "./portfolioData";
import { RESUME_TEXT } from "./resumeText";

export interface SkillGroup {
  label: string;
  skills: string[];
}

/** The résumé's SKILLS section ("Languages: Python, C++17/20, …"), as groups of skills. */
export const SKILL_GROUPS: SkillGroup[] = parseSkills(RESUME_TEXT);

function parseSkills(text: string): SkillGroup[] {
  const section = text.split(/\n\s*SKILLS\s*\n/)[1]?.split(/\n\s*\n/)[0] ?? "";
  return section.split("\n").flatMap((line) => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return [];
    const skills = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return [{ label: m[1].trim(), skills }];
  });
}

/** The group a skill belongs to, matched case-insensitively. */
export function groupOf(skill?: string): SkillGroup | undefined {
  const s = skill?.toLowerCase();
  return s ? SKILL_GROUPS.find((g) => g.skills.some((k) => k.toLowerCase() === s)) : undefined;
}

/** Names to look for: "C++17/20" → C++, "TypeScript/JavaScript" → both, "PostgreSQL" → also Postgres. */
const ALIASES: Record<string, string[]> = {
  "C++17/20": ["C++"],
  "TypeScript/JavaScript": ["TypeScript", "JavaScript"],
  "LiDAR point clouds": ["LiDAR", "point clouds"],
  PostgreSQL: ["PostgreSQL", "Postgres"],
  "Pub/Sub": ["Pub/Sub"],
  "CI/CD": ["CI/CD"],
};

function aliases(skill: string): string[] {
  return (
    ALIASES[skill] ??
    skill
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** Whole-word match. Short or all-caps names (Go, C++, ROS, AWS, REST) must match case too. */
export function mentions(text: string, name: string): boolean {
  const caseSensitive = name.length <= 3 || name === name.toUpperCase();
  const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  // No lookbehind: older Safari can't parse it.
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9+])`, caseSensitive ? "" : "i").test(text);
}

export type Evidence =
  | { kind: "work"; label: string; detail: string; payload: { work: WorkProject; company: string; role: Role } }
  | { kind: "project"; label: string; detail: string; payload: { project: Project } };

/** Where a skill shows up in my work and projects (tags first, then descriptions and highlights). */
export function evidenceFor(skill: string): Evidence[] {
  const names = aliases(skill);
  const hit = (fields: (string | undefined)[]) =>
    names.some((n) => fields.some((f) => !!f && mentions(f, n)));
  const out: Evidence[] = [];
  for (const exp of experiences) {
    for (const role of [...exp.roles].reverse()) {
      for (const work of role.projects) {
        if (hit([...(work.techStack ?? []), work.name, work.description, ...(work.highlights ?? [])])) {
          out.push({
            kind: "work",
            label: work.name,
            detail: `${exp.company} · ${role.title}`,
            payload: { work, company: exp.company, role },
          });
        }
      }
    }
  }
  for (const project of projects) {
    if (hit([...(project.techStack ?? []), project.name, project.description, ...(project.highlights ?? [])])) {
      out.push({ kind: "project", label: project.name, detail: "Project", payload: { project } });
    }
  }
  return out;
}
