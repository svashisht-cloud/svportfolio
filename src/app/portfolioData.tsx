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
    techStack: ["Next.js", "AI", "PDF"],
    projectUrl: "https://www.forteresume.com/",
    featured: true,
    role: "Solo developer",
    highlights: ["Custom AI pipeline", "PDF & DOCX export", "Production deployment"],
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
      "Real-time AI mock interviews for coding and system design. Streams a live interview session, then delivers a detailed multi-dimensional evaluation on completion. Built with end-to-end streaming and multi-turn conversation handling.",
    techStack: ["Next.js", "AI", "Streaming"],
    projectUrl: "https://mock-loop.vercel.app/dashboard",
    featured: true,
    role: "Solo developer",
    highlights: ["Real-time streaming", "Multi-dimensional evaluation", "Multi-turn sessions"],
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
    projectUrl: "https://svashisht.netlify.app/",
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

export const experiences: Experience[] = [
  {
    company: "Outrider",
    logo: "/images/outrider.jpeg",
    roles: [
      {
        title: "Software Engineering Intern",
        dateRange: "June 2022 – Dec 2022",
        projects: [
          {
            name: "ROS Bag Upload & Cloud Data Pipeline",
            description:
              "Built backend infrastructure for automatically detecting, processing, and uploading ROS bag files generated by autonomous vehicles to cloud storage for debugging and offline analysis. The system continuously monitored directories for newly generated bags, handled upload retries, and ensured reliable transfer of large robotics datasets to AWS S3.",
            techStack: ["Python", "ROS", "AWS S3", "Linux", "Multithreading"],
            highlights: [
              "Continuous background monitoring service",
              "Multithreaded upload workers",
              "Fault-tolerant retry mechanisms",
              "Cloud-integrated robotics data workflows",
              "Large-scale robotics data management",
            ],
          },
          {
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
        dateRange: "Jan 2023 – Dec 2024",
        projects: [
          {
            name: "ROS Log Streaming & Filtering Platform",
            description:
              "Designed and implemented scalable ROS logging infrastructure enabling web clients to dynamically subscribe to filtered robotics logs in real time. Built systems that consumed logs from /rosout_agg, filtered them based on client-selected ROS nodes, and streamed relevant logs efficiently to dashboard users.",
            techStack: ["ROS", "Python", "C++", "Linux", "Docker"],
            highlights: [
              "Dynamic topic subscription infrastructure",
              "Real-time ROS log streaming",
              "Multi-user scalable architecture",
              "Client-specific filtering pipelines",
              "Runtime publisher cleanup and management",
            ],
          },
          {
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
          {
            name: "Browser-Based 3D Visualization System",
            description:
              "Helped develop browser-based visualization tooling for autonomous vehicle operations, reducing dependence on traditional robotics visualization tools like RViz. Built interactive web interfaces enabling operators and engineers to inspect robotics environments and operational state remotely.",
            techStack: ["React", "Three.js", "TypeScript", "ROS"],
            highlights: [
              "Real-time web visualization",
              "Robotics data rendering pipelines",
              "Cross-functional tooling",
              "Interactive operational interfaces",
              "Modern browser-based robotics tooling",
            ],
          },
        ],
      },
      {
        title: "Software Engineer 2",
        dateRange: "Dec 2024 – Present",
        projects: [
          {
            name: "Real-Time Fleet Operations Dashboard",
            description:
              "Designed and developed real-time operational dashboards for autonomous yard truck deployments, providing visibility into mission state, vehicle telemetry, operational health, and deployment diagnostics across multiple production environments.",
            techStack: ["React", "TypeScript", "ROS", "WebSockets", "Docker"],
            highlights: [
              "Real-time telemetry dashboards",
              "Multi-client operational tooling",
              "Cross-system observability",
              "Production deployment monitoring",
              "Scalable frontend architecture",
            ],
          },
          {
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
          {
            name: "Configuration Verification & State Machine Infrastructure",
            description:
              "Built finite state machine infrastructure and backend-integrated validation workflows for vehicle configuration verification and reprovisioning systems. Implemented automated transition handling and reliability-focused validation logic for operational workflows.",
            techStack: ["C++", "ROS", "HTTP APIs"],
            highlights: [
              "FSM-driven workflow orchestration",
              "Automated validation pipelines",
              "Reliability-focused infrastructure",
              "Backend-integrated operational tooling",
              "Robust transition handling",
            ],
          },
        ],
      },
    ],
  },
];
