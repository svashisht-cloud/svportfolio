"use client";
import React, { useState } from "react";
import SnakeGame from "../components/SnakeGame";
import SearchVisualizer from "../components/SearchVisualizer"
import Image from "next/image";
import LandingSection from "../components/LandingSection";
import { FaHome } from "react-icons/fa";

interface Project {
  name: string;
  image: string;
  description: string;
  codeUrl?: string;
  projectUrl?: string; // New optional field for the live project domain
  demoComponent?: React.ReactNode;
}

const projects: Project[] = [
  {
    name: "Windows XP Clone",
    image: "/images/windowIcon.png",
    description:
      "A fully functional Windows-like environment built entirely in React. This project replicates core features of the Windows operating system, allowing users to open multiple draggable windows that include a custom music player, video player, photo viewer, and resume viewer. I developed every component from scratch and hand-coded all the CSS.",
    codeUrl: "https://github.com/example/project1",
    projectUrl: "https://svashisht.netlify.app/", // Example live project URL
  },
  {
    name: "Search Algorithm Viz",
    image: "/images/search1.png",
    description: "SearchVisualizer is an interactive React app that demonstrates multiple search algorithms (BFS, DFS, Greedy DFS, Uniform Cost, and A*) on a 2D grid. Users set the start and target nodes via mouse or touch, then watch the algorithm explore the grid and highlight the path, providing visual insight into algorithm behavior.",
    demoComponent: <SearchVisualizer />
  }
  ,{
    name: "Snake Game",
    image: "/images/snake1.png",
    description: "Snake Game is a modern take on the classic arcade game built in React. It features a grid-based board with smooth animations, intuitive arrow-key controls, and dynamic score tracking. Guide your snake to eat food and grow, while avoiding collisions with walls or itself, and restart the game seamlessly after a collision.",
    codeUrl: "https://github.com/shubh-vashisht/Snake-Game",
    demoComponent: (<SnakeGame />),
  },
  {
    name: "Moral-Fibre",
    image: "/images/npm1.png",
    description: "Moralfibre is a lightweight JavaScript and Node.js utility library featuring 36 essential functions for array manipulation, data transformation, and advanced operations like templating, binding, and deep equality testing. Installable via npm, it simplifies common programming tasks, enhancing productivity and performance in your applications. An indispensable tool for efficient, streamlined development.",
    codeUrl: "https://github.com/shubh-vashisht/moralfibre",
  },
  {
    name: "PySvap",
    image: "/images/python.svg.png",
    description: "A lightweight Python library that leverages Pillow to manipulate pixel-level RGB values. It offers 14 functions—gaussian blur, negative, grayscale, saturation, posterize, lighten/darken, pixelate, sepia effects, temperature, overlay, and color shift—for creating custom image effects.",
    codeUrl: "https://github.com/shubh-vashisht/PySvap",
  },
  {
    name: "Discord Bot",
    image: "/images/discord1.png",
    description: "A Discord bot built with Node.js and discord.js that provides random anime quotes (!quote), solves basic math equations (!math), and delivers COVID-19 info for Indian cities (!covidInfo).",
    codeUrl: "https://github.com/shubh-vashisht/Discord-Bot-with-Nodejs",
  },
  {
    name: "Personal Portfolio (Old)",
    image: "/images/person.webp",
    description: "This was an older porfolio website that I built using React, and Three.js. It features a clean, minimalist design with a responsive layout, smooth scrolling, and a dynamic typing effect.",
    // codeUrl: "https://github.com/shubh-vashisht/Discord-Bot-with-Nodejs",
    projectUrl: "https://shubhvashisht.com/"
  }
];

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showDemo, setShowDemo] = useState<boolean>(false);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDemo(false);
    setIsMenuOpen(false);
  };

  const handleGoToCode = () => {
    if (selectedProject) {
      window.open(selectedProject.codeUrl, "_blank");
    }
  };

  const handleGoToProject = () => {
    if (selectedProject && selectedProject.projectUrl) {
      window.open(selectedProject.projectUrl, "_blank");
    }
  };

  return (
    <div className="h-screen flex flex-col relative">
      {/* Mobile Top Bar: visible only on mobile */}
      <div className="bg-white h-16 p-4 flex items-center justify-between lg:hidden z-50">
      <div className="flex items-center space-x-4">
          <div
            className="text-2xl font-bold text-blue-900 cursor-pointer"
            onClick={() => {
              setSelectedProject(null);
              setShowDemo(false);
            }}
          >
            SV
          </div>
          <button
            onClick={() => {
              setSelectedProject(null);
              setShowDemo(false);
            }}
            className="px-2 py-1 text-2xl text-blue-900 rounded flex items-center cursor-pointer"
          >
            <FaHome className="w-5 h-5 mr-1" />
          </button>
        </div>
        <button
          className="text-blue-900 text-xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 bg-gray-800 bg-opacity-50 z-40 transition-transform duration-300 transform lg:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-0">
          {projects.map((project) => {
            const isActive = selectedProject?.name === project.name;
            return (
              <button
                key={project.name}
                onClick={() => handleProjectClick(project)}
                className={`w-full flex items-center py-4 px-4 transition-colors border-b border-gray-600 last:border-0 text-white
                  ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}
                `}
              >
                <Image
                  src={project.image}
                  alt={project.name}
                  width={50}
                  height={50}
                  className="mr-4"
                />
                <span className="text-lg">{project.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Sidebar (25% width) */}
        <div className="bg-white w-1/4 p-6 flex flex-col overflow-y-auto">
          <h2
            className="cursor-pointer text-4xl font-bold mb-2 text-blue-900"
            onClick={() => {
              setSelectedProject(null);
              setShowDemo(false);
            }}
          >
            Shubh Vashisht
          </h2>
          {/* Label under header */}
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            My Work
          </h3>
          <div className="space-y-4 mt-2">
            {projects.map((project) => {
              const isActive = selectedProject?.name === project.name;
              return (
                <button
                key={project.name}
                onClick={() => handleProjectClick(project)}
                className={`w-full flex flex-col items-center justify-center h-40 py-4 text-black font-semibold shadow-md transition rounded-none overflow-hidden
                  ${isActive ? "bg-gray-300" : "bg-gray-100 hover:bg-gray-200"}
                `}
              >
                <Image
                  src={project.image}
                  alt={project.name}
                  width={100}
                  height={60}
                  className="max-w-full object-contain"
                />
                <span className="mt-2 text-lg">{project.name}</span>
              </button>
              
              );
            })}
          </div>
        </div>

        {/* Main Content (75% width) */}
        <div className="flex-1 flex items-center justify-center bg-[#102542] p-6">
          {selectedProject ? (
            <div className="max-w-4xl bg-gray-900 p-6 rounded-lg">
              {!showDemo ? (
                // Project Detail Page
                <div>
                  <Image
                    src={selectedProject.image}
                    alt={selectedProject.name}
                    width={300}
                    height={180}
                    className="mx-auto"
                  />
                  <h1 className="text-white text-3xl mt-4 text-center">
                    {selectedProject.name}
                  </h1>
                  <p className="text-gray-300 mt-2 text-center">
                    {selectedProject.description}
                  </p>
                  <div className="mt-4 flex justify-center space-x-4">
                    {selectedProject.codeUrl && (<button
                      onClick={handleGoToCode}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Go to Code
                    </button>)}
                    {selectedProject.projectUrl && (
                      <button
                        onClick={handleGoToProject}
                        className="bg-orange-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                      >
                        Go to Project
                      </button>
                    )}
                    {selectedProject.demoComponent && (
                      <button
                        onClick={() => setShowDemo(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Working Demo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Working Demo View
                <div className="everything_demo_component h-full w-full">
                  <div className="mb-4 flex justify-between items-center">
                    <h1 className="text-white text-3xl">
                      {selectedProject.name} Demo
                    </h1>
                    <button
                      onClick={() => setShowDemo(false)}
                      className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                    >
                      Back
                    </button>
                  </div>
                  {selectedProject.demoComponent}
                </div>
              )}
            </div>
          ) : (
            <LandingSection setIsMenuOpen={setIsMenuOpen}/>
          )}
        </div>
      </div>

      {/* Mobile Main Content */}
      <div className="lg:hidden flex-1 flex items-center justify-center bg-[#102542] p-4">
        {selectedProject ? (
          <div className="max-w-4xl bg-gray-900 p-6 rounded-lg">
            {!showDemo ? (
              <div>
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.name}
                  width={300}
                  height={180}
                  className="mx-auto"
                />
                <h1 className="text-white text-3xl mt-4 text-center">
                  {selectedProject.name}
                </h1>
                <p className="text-gray-300 mt-2 text-center">
                  {selectedProject.description}
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={handleGoToCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Go to Code
                  </button>
                  {selectedProject.projectUrl && (
                    <button
                      onClick={handleGoToProject}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                    >
                      Go to Project
                    </button>
                  )}
                  {selectedProject.demoComponent && (
                    <button
                      onClick={() => setShowDemo(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Working Demo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h1 className="text-white text-3xl">
                    {selectedProject.name} Demo
                  </h1>
                  <button
                    onClick={() => setShowDemo(false)}
                    className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                  >
                    Back
                  </button>
                </div>
                {selectedProject.demoComponent}
              </div>
            )}
          </div>
        ) : (
          <LandingSection setIsMenuOpen={setIsMenuOpen}/>
        )}
      </div>
    </div>
  );
}
