/**
 * Plain-text copy of public/resume.pdf, sent to ShubhGPT's model as context.
 * Extracted from the PDF with line breaks tidied; wording unchanged.
 * Deliberately left out: phone number. GitHub points to the current account.
 *
 * Update this whenever public/resume.pdf changes.
 */
export const RESUME_TEXT = `Shubh Vashisht
Software Engineer — Robotics & Autonomy Infrastructure
Boston, MA · shubhv2@gmail.com
github.com/svashisht-cloud · linkedin.com/in/shubh-vashisht · shubhvashisht.com

SUMMARY
Software engineer with nearly 4 years at Outrider building software for autonomous yard trucks: on-vehicle data capture, logging, and fleet tooling used by dispatchers and engineers at customer sites. Solo founder of Forte, a paid AI resume SaaS.

EXPERIENCE

Forte — AI resume-tailoring SaaS · forteresume.com (Remote)
Founder & Software Engineer, Apr 2026 – Present
- Built and run a paid AI resume SaaS solo: 15 paying customers and ~100 active users (Next.js, Supabase/Postgres).
- Cut LLM cost per resume generation 80% ($0.10 → $0.02) by consolidating the pipeline into fewer model calls per generation and routing simpler steps to cheaper models.
- Built pgvector job matching over ingested Greenhouse/Lever postings, feeding matches directly into tailoring.
- Instrumented funnel analytics and set India pricing (₹499/month) from checkout data; features driven by user feedback.

Outrider — Autonomous yard trucks (Denver, CO)
Software Engineer II, Nov 2024 – Mar 2026
- Built event-triggered LiDAR recording in the ROS bagger: an in-memory 30-second ring buffer flushed when any config-registered event fires, plus the next 30 seconds, LZ4-compressed. Cut LiDAR incident debugging from 3–4 hours of simulation repro to ~5 minutes in Foxglove, without recording full missions at 20–30 GB/min.
- Proposed and built live log streaming from trucks to the operator dashboard on the existing video-stream pipeline, filterable by service; replaced 5–10 minute SSH log hunts with logs in seconds, and owned it through on-call.
- Evolved it into a subscription-based logger; traced 5–10 s log delays on a thousands-of-messages/sec service to dead subscriptions and fixed them with grace-period cleanup.
- Built mission-bag upload from trucks to AWS S3 (5–10 GB per mission) over bandwidth-limited customer-site networks.
- Designed on-truck configuration verification that runs in Buildroot right after reprogramming, before ROS starts, to catch incompatible service images; made the case for that placement over a ROS service and delivered it in about a week.
- Migrated the build to Bazel Bzlmod; deployed Dockerized Python, Go, and C++ services on AWS and Azure with Kubernetes and Terraform.

Associate Software Engineer, Dec 2022 – Nov 2024
- Built the full-stack robot dashboard dispatchers and engineers used for truck control, telemetry, live video, and logs (React, TypeScript, Redux, Node.js, WebSockets).
- Proposed and built an in-browser Three.js 3D yard view (truck pose, point clouds, containers) that replaced a 5–10 minute RViz startup with a view that loads in seconds; reduced rendered point clouds from ~60k to ~5k points to keep it smooth.
- Raised yard-inventory accuracy on slanted parking spots from ~70% to 95–97% at a production customer yard by tracing misreads to capture geometry and introducing offset-based capture; isolated remaining errors to the CV model.

Software Engineering Intern, Jun 2022 – Dec 2022
- Built a React and Three.js dashboard visualizing robotic-arm motion in real time, improving rendering performance by 85%.

PROJECTS
MockLoop — mock-loop.vercel.app (Feb 2025)
AI mock-interview platform with coding and system-design modes, an Excalidraw design canvas, rubric-based LLM evaluation, and session replay (Next.js, Supabase, Anthropic API). (Shown on this site as "AI Interviewer".)

SKILLS
Languages: Python, C++17/20, TypeScript/JavaScript, Go, SQL
Robotics: ROS, rosbag, Foxglove, RViz, LiDAR point clouds, Three.js, Linux, Buildroot
Backend & infra: gRPC/Protobuf, REST, WebSockets, Pub/Sub, PostgreSQL, Docker, Kubernetes, Terraform, AWS, Azure
Frontend & tooling: React, Redux, Next.js, Bazel/Bzlmod, CI/CD, pytest, Jest, Playwright

EDUCATION
University of Massachusetts Amherst — B.S., Computer Science, Dec 2022`;
