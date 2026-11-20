import React from "react";
import SnakeGame from "../components/SnakeGame";
import SearchVisualizer from "../components/SearchVisualizer";

export interface Project {
  name: string;
  image?: string;
  description: string;
  techStack?: string[];
  codeUrl?: string;
  projectUrl?: string;
  demoComponent?: React.ReactNode;
  featured?: boolean;
  role?: string;
  highlights?: string[];
}

export interface WorkProject {
  name: string;
  description: string;
  techStack?: string[];
  codeUrl?: string;
  projectUrl?: string;
  highlights?: string[];
}

export interface Role {
  title: string;
  dateRange: string;
  projects: WorkProject[];
}

export interface Experience {
  company: string;
  logo: string;
  roles: Role[];
}

export const projects: Project[] = [
  {
    name: "Forte Resume",
    image: "/images/forte2.png",
    description:
      "AI-powered resume tailor — upload your resume and a job description, and Forte rewrites your resume to match the role, then exports a recruiter-ready PDF and DOCX. Built end-to-end with a custom AI pipeline and PDF ingestion layer.",
    techStack: ["Next.js", "AI", "Supabase", "pgvector", "PDF"],
    projectUrl: "https://www.forteresume.com/",
    featured: true,
    role: "Founder · built and run solo",
    highlights: [
      "15 paying customers, ~100 active users",
      "LLM cost per résumé cut 80% ($0.10 → $0.02)",
      "pgvector job matching over Greenhouse and Lever postings",
      "PDF & DOCX export",
    ],
  },
  {
    name: "Arcfield",
    image: "/images/arcfield.png",
    description:
      "My freelance practice: fleet software for robotics teams. Arcfield builds the ops dashboards, live telemetry and log pipelines that robots need in the field, so autonomy engineers can stay focused on autonomy. The site includes a simulated fleet dashboard with yard, warehouse and city scenarios.",
    techStack: ["React", "Three.js", "ROS"],
    projectUrl: "https://arcfield-autonomy.vercel.app/",
    featured: true,
    role: "Founder · freelance",
    highlights: ["Fleet ops dashboards", "Log & data pipelines", "Simulated fleet demo"],
  },
  {
    name: "AI Interviewer",
    image: "/images/MockLoop1.png",
    description:
      "MockLoop: real-time AI mock interviews for coding and system design, with an Excalidraw design canvas, rubric-based LLM evaluation and session replay. Streams a live interview session, then delivers a detailed multi-dimensional evaluation on completion. Built with end-to-end streaming and multi-turn conversation handling.",
    techStack: ["Next.js", "AI", "Supabase", "Anthropic API", "Streaming"],
    projectUrl: "https://mock-loop.vercel.app/dashboard",
    featured: true,
    role: "Solo developer",
    highlights: [
      "Excalidraw design canvas",
      "Rubric-based LLM evaluation",
      "Session replay",
      "Real-time streaming, multi-turn sessions",
    ],
  },
  {
    name: "Search Algorithm Viz",
    image: "/images/search1.png",
    description:
      "Interactive visualizer for five pathfinding algorithms — BFS, DFS, Greedy DFS, Uniform Cost, and A*. Set start and target nodes on a 2D grid, then watch the algorithm explore in real-time and trace the shortest path.",
    techStack: ["React", "Algorithms"],
    demoComponent: <SearchVisualizer />,
    role: "Solo developer",
    highlights: ["5 algorithms", "Mouse & touch support", "Live step-through"],
  },
  {
    name: "Snake Game",
    image: "/images/snake1.png",
    description:
      "Classic Snake built in React with a grid-based board, smooth frame-rate-controlled animation, arrow-key and swipe controls, and dynamic score tracking.",
    techStack: ["React", "JavaScript"],
    codeUrl: "https://github.com/shubh-vashisht/Snake-Game",
    demoComponent: (<SnakeGame />),
    role: "Solo developer",
    highlights: ["Frame-rate animation", "Swipe + keyboard controls"],
  },
  {
    name: "Moral-Fibre",
    image: "/images/npm1.png",
    description:
      "Lightweight JavaScript utility library with 36 functions for array manipulation, data transformation, templating, binding, and deep equality testing. Published on npm and designed for tree-shaking.",
    techStack: ["Node.js", "npm"],
    codeUrl: "https://github.com/shubh-vashisht/moralfibre",
    role: "Author",
    highlights: ["36 utility functions", "Published on npm", "Tree-shakeable"],
  },
  {
    name: "PySvap",
    image: "/images/python.svg.png",
    description:
      "Python image-effects library built on Pillow. Offers 14 pixel-level operations — gaussian blur, negative, grayscale, saturation, posterize, sepia, temperature, color shift, and more — usable as a library or CLI.",
    techStack: ["Python", "Pillow"],
    codeUrl: "https://github.com/shubh-vashisht/PySvap",
    role: "Author",
    highlights: ["14 image effects", "CLI + library API"],
  },
  {
    name: "Windows XP Clone",
    image: "/images/windowIcon.png",
    description:
      "Full Windows-like environment built entirely in React — draggable windows, a custom music player, video player, photo viewer, and resume viewer. Every component and all CSS written from scratch.",
    techStack: ["React", "CSS"],
    codeUrl: "https://gitlab.com/aire7194829/windows-simulator",
    projectUrl: "https://windowsxpsimulator.vercel.app/",
    role: "Solo developer",
    highlights: ["4 apps from scratch", "Draggable window system", "Hand-coded CSS"],
  },
  {
    name: "Discord Bot",
    image: "/images/discord1.png",
    description:
      "Event-driven Discord bot built with Node.js and discord.js. Handles multiple commands: random anime quotes, math equation evaluation, and live COVID-19 stats for Indian cities via external API integration.",
    techStack: ["Node.js", "discord.js"],
    codeUrl: "https://github.com/shubh-vashisht/Discord-Bot-with-Nodejs",
    role: "Solo developer",
    highlights: ["3 command types", "External API integration"],
  },
  {
    name: "Personal Portfolio (Old)",
    image: "/images/person.webp",
    description:
      "Earlier portfolio site built with React and Three.js — features a 3D animated scene, minimalist layout, smooth scrolling, and a dynamic typing effect.",
    techStack: ["React", "Three.js"],
    projectUrl: "https://shubhvashisht.com/",
    role: "Solo developer",
    highlights: ["Three.js 3D scene", "Dynamic typing effect"],
  },
];

/**
 * Work history, newest company first; each company's roles run oldest → newest.
 * Roles, dates and numbers follow public/resume.pdf (see resumeText.ts), which wins
 * when the two disagree. Items marked "site only" aren't on the résumé.
 */
export const experiences: Experience[] = [
  {
    company: "Forte",
    logo: "/images/forte2.png",
    roles: [
      {
        title: "Founder & Software Engineer",
        dateRange: "Apr 2026 – Present",
        projects: [
          {
            name: "Forte: AI Résumé SaaS",
            description:
              "Built and run Forte, a paid AI résumé-tailoring SaaS, on my own: 15 paying customers and about 100 active users. I instrumented funnel analytics, set India pricing (₹499/month) from checkout data, and build features from user feedback.",
            techStack: ["Next.js", "Supabase", "Postgres"],
            projectUrl: "https://www.forteresume.com/",
            highlights: [
              "15 paying customers, ~100 active users",
              "Built and run solo",
              "Funnel analytics; India pricing (₹499/month) set from checkout data",
              "Features driven by user feedback",
            ],
          },
          {
            name: "LLM Pipeline Cost Reduction",
            description:
              "Cut the LLM cost of each résumé generation by 80% ($0.10 → $0.02) by consolidating the pipeline into fewer model calls per generation and routing simpler steps to cheaper models.",
            techStack: ["AI"],
            highlights: [
              "LLM cost per résumé: $0.10 → $0.02 (−80%)",
              "Fewer model calls per generation",
              "Simpler steps routed to cheaper models",
            ],
          },
          {
            name: "pgvector Job Matching",
            description:
              "Built job matching with pgvector over ingested Greenhouse and Lever postings, feeding the matches directly into résumé tailoring.",
            techStack: ["pgvector", "Postgres"],
            highlights: [
              "Vector search over Greenhouse and Lever postings",
              "Matches feed straight into tailoring",
            ],
          },
        ],
      },
    ],
  },
  {
    company: "Outrider",
    logo: "/images/outrider.jpeg",
    roles: [
      {
        title: "Software Engineering Intern",
        dateRange: "Jun 2022 – Dec 2022",
        projects: [
          {
            name: "Robotic-Arm Motion Dashboard",
            description:
              "Built a React and Three.js dashboard that visualizes robotic-arm motion in real time, and improved its rendering performance by 85%.",
            techStack: ["React", "Three.js"],
            highlights: ["Rendering performance up 85%", "Real-time robotic-arm visualization"],
          },
          {
            // Site only.
            name: "Networking & System Diagnostics Tooling",
            description:
              "Developed internal tooling for inspecting runtime networking and system health information across robotics deployments. Built interfaces exposing connection state, queue metrics, and networking diagnostics to help engineers debug distributed robotics systems in production.",
            techStack: ["Linux", "Networking", "React", "TypeScript"],
            highlights: [
              "Real-time diagnostics visualization",
              "Connection state inspection",
              "Queue monitoring infrastructure",
              "Operational debugging tooling",
              "Cross-service observability",
            ],
          },
        ],
      },
      {
        title: "Associate Software Engineer",
        dateRange: "Dec 2022 – Nov 2024",
        projects: [
          {
            name: "Real-Time Fleet Operations Dashboard",
            description:
              "Built the full-stack robot dashboard that dispatchers and engineers used for truck control, telemetry, live video and logs. It gave visibility into mission state, vehicle telemetry, operational health and deployment diagnostics across multiple production environments.",
            techStack: ["React", "TypeScript", "Redux", "Node.js", "WebSockets", "ROS", "Docker"],
            highlights: [
              "Used by dispatchers and engineers at customer sites",
              "Truck control, telemetry, live video and logs",
              "Real-time telemetry dashboards",
              "Production deployment monitoring",
            ],
          },
          {
            name: "Browser-Based 3D Visualization System",
            description:
              "Proposed and built an in-browser Three.js 3D yard view (truck pose, point clouds, containers) that replaced a 5–10 minute RViz startup with a view that loads in seconds. I cut the rendered point clouds from ~60k to ~5k points to keep it smooth, so operators and engineers could inspect the yard remotely.",
            techStack: ["React", "Three.js", "TypeScript", "ROS"],
            highlights: [
              "RViz startup 5–10 min → loads in seconds",
              "Point clouds ~60k → ~5k points, still smooth",
              "Truck pose, point clouds and containers",
              "Proposed and built it",
            ],
          },
          {
            name: "Yard Inventory Accuracy on Slanted Spots",
            description:
              "Raised yard-inventory accuracy on slanted parking spots from ~70% to 95–97% at a production customer yard. I traced the misreads to capture geometry, introduced offset-based capture, and isolated the remaining errors to the CV model.",
            highlights: [
              "Accuracy ~70% → 95–97%",
              "Root cause: capture geometry",
              "Fix: offset-based capture",
              "Remaining errors isolated to the CV model",
            ],
          },
          {
            // Site only.
            name: "Remote Support & Telemetry Infrastructure",
            description:
              "Contributed to remote support infrastructure enabling engineers and operators to remotely inspect, debug, and monitor autonomous vehicle deployments in production. Worked on telemetry pipelines, operational observability tooling, and distributed debugging workflows.",
            techStack: ["ROS", "Linux", "Docker", "Networking"],
            highlights: [
              "Distributed telemetry infrastructure",
              "Operational monitoring systems",
              "Production debugging workflows",
              "Cloud-integrated support tooling",
              "Reliability-focused infrastructure",
            ],
          },
        ],
      },
      {
        title: "Software Engineer II",
        dateRange: "Nov 2024 – Mar 2026",
        projects: [
          {
            name: "Event-Triggered LiDAR Recording",
            description:
              "Built event-triggered LiDAR recording in the ROS bagger: an in-memory 30-second ring buffer, flushed when any config-registered event fires, plus the next 30 seconds, LZ4-compressed. It cut LiDAR incident debugging from 3–4 hours of simulation repro to about 5 minutes in Foxglove, without recording full missions at 20–30 GB a minute.",
            techStack: ["ROS", "rosbag", "LiDAR", "LZ4", "Foxglove"],
            highlights: [
              "Incident debugging: 3–4 h → ~5 min",
              "30 s in-memory ring buffer, plus the next 30 s",
              "Fires on any config-registered event",
              "No full-mission recording at 20–30 GB/min",
            ],
          },
          {
            name: "ROS Log Streaming & Filtering Platform",
            description:
              "Proposed and built live log streaming from trucks to the operator dashboard on the existing video-stream pipeline, filterable by service, which replaced 5–10 minute SSH log hunts with logs in seconds. I evolved it into a subscription-based logger: clients subscribe to the logs from /rosout_agg for the ROS nodes they pick. When a busy service (thousands of messages a second) showed 5–10 s log delays, I traced them to dead subscriptions and fixed them with grace-period cleanup. I owned it through on-call.",
            techStack: ["ROS", "Python", "C++", "Linux", "Docker"],
            highlights: [
              "SSH log hunts 5–10 min → logs in seconds",
              "Filterable by service, on the existing video-stream pipeline",
              "5–10 s delays traced to dead subscriptions; fixed with grace-period cleanup",
              "Owned it through on-call",
            ],
          },
          {
            name: "ROS Bag Upload & Cloud Data Pipeline",
            description:
              "Built mission-bag upload from trucks to AWS S3 (5–10 GB per mission) over bandwidth-limited customer-site networks. A background service watches for newly generated bags, uploads them with multithreaded workers, and retries failed transfers, so large robotics datasets reliably reach the cloud for debugging and offline analysis.",
            techStack: ["Python", "ROS", "AWS S3", "Linux", "Multithreading"],
            highlights: [
              "5–10 GB per mission",
              "Bandwidth-limited customer-site networks",
              "Multithreaded upload workers",
              "Fault-tolerant retries",
            ],
          },
          {
            name: "Configuration Verification & State Machine Infrastructure",
            description:
              "Designed on-truck configuration verification that runs in Buildroot right after reprogramming, before ROS starts, to catch incompatible service images. I made the case for that placement over a ROS service and delivered it in about a week. I also built finite-state-machine infrastructure and backend-integrated validation workflows for vehicle configuration verification and reprovisioning.",
            techStack: ["C++", "ROS", "Buildroot", "HTTP APIs"],
            highlights: [
              "Runs in Buildroot, before ROS starts",
              "Catches incompatible service images after reprogramming",
              "Argued for this placement over a ROS service",
              "Delivered in about a week",
              "FSM-driven workflow orchestration",
            ],
          },
          {
            name: "Bazel Migration & Multi-Cloud Deployment",
            description:
              "Migrated the build to Bazel Bzlmod, and deployed Dockerized Python, Go and C++ services on AWS and Azure with Kubernetes and Terraform.",
            techStack: ["Bazel", "Docker", "Kubernetes", "Terraform", "AWS", "Azure"],
            highlights: [
              "Build migrated to Bazel Bzlmod",
              "Python, Go and C++ services in Docker",
              "AWS and Azure, with Kubernetes and Terraform",
            ],
          },
          {
            // Site only.
            name: "Runtime Service Management Platform",
            description:
              "Developed onboard runtime platform infrastructure in C++ on Linux for orchestrating distributed autonomy services and managing multi-process robotics systems running on autonomous vehicles.",
            techStack: ["C++", "Linux", "ROS", "Systemd", "Docker"],
            highlights: [
              "Multi-process orchestration",
              "Linux platform engineering",
              "Reliability-focused infrastructure",
              "Runtime lifecycle management",
              "Production robotics platform systems",
            ],
          },
        ],
      },
    ],
  },
];

/** True for a role held now ("… – Present"). */
export const isCurrentRole = (role: Role) => /present/i.test(role.dateRange);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Start of a role, from a date range like "Jun 2022 – Dec 2022". */
export function roleStart(role: Role): { y: number; m: number } | null {
  const [mon, year] = (role.dateRange.split(/[–-]/)[0] ?? "").trim().toLowerCase().split(/\s+/);
  const m = MONTHS.indexOf(mon?.slice(0, 3) ?? "");
  const y = Number(year);
  return m >= 0 && y ? { y, m } : null;
}

export interface CareerStep {
  company: string;
  role: Role;
  /** "4.0" for the fourth role, counting every company. */
  version: string;
}

/** Every role across companies, oldest first, numbered like software versions. */
export function careerSteps(): CareerStep[] {
  const at = (r: Role) => {
    const s = roleStart(r);
    return s ? s.y * 12 + s.m : 0;
  };
  return experiences
    .flatMap((e) => e.roles.map((role) => ({ company: e.company, role })))
    .sort((a, b) => at(a.role) - at(b.role))
    .map((s, i) => ({ ...s, version: `${i + 1}.0` }));
}

/** A work item by name, with the company and role it belongs to (the payload a `work` window takes). */
export function findWork(name: string): { work: WorkProject; company: string; role: Role } | undefined {
  for (const exp of experiences) {
    for (const role of exp.roles) {
      const work = role.projects.find((w) => w.name === name);
      if (work) return { work, company: exp.company, role };
    }
  }
  return undefined;
}
