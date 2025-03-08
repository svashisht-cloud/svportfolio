"use client";
import React, { useState } from "react";
import Image from "next/image";
import { FaUserAlt, FaLinkedin, FaGithub, FaYoutube, FaFileDownload, FaEnvelope } from "react-icons/fa";

const LandingSection = ({ setIsMenuOpen }) => {
  const [showAboutMe, setShowAboutMe] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  return (
    <div className="relative w-full sm:w-4/5 h-[70vh] overflow-hidden bg-gray-900 rounded-lg p-4">
      {/* Landing Content */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex flex-col items-center justify-center ${
          showAboutMe || showSocials || showExperience || showEducation
            ? "-translate-x-full"
            : "translate-x-0"
        }`}
      >
        <Image
          src="/images/personal.png"
          alt="Landing"
          width={200}
          height={300}
          className="w-32 sm:w-48 rounded-full object-cover mx-auto mt-2"
        />
        <h1 className="text-white text-center font-bold text-2xl sm:text-4xl mt-6 mx-4">
          Hey, my name is Shubh.
        </h1>
        <p className="text-gray-300 mt-3 text-center mx-4 text-sm sm:text-base">
          I'm a software, web, and robotics developer with a passion for creating innovative solutions.
        </p>
        <div className="mt-4 flex flex-col items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAboutMe(true)}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded"
            >
              About Me
            </button>
            <button
              onClick={() => setShowSocials(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded"
            >
              Socials
            </button>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="mt-4 px-4 py-2 lg:hidden bg-gray-800 hover:bg-gray-900 text-white rounded"
          >
            Explore Projects
          </button>
        </div>
      </div>

      {/* About Me Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center ${
          showAboutMe && !showExperience && !showEducation
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            About Me
          </h2>
          <div className="w-full text-left">
            <p className="text-gray-300 mb-2">
              <strong>Name:</strong> Shubh Vashisht
            </p>
            <p className="text-gray-300 mb-2">
              <strong>Year Born:</strong> 2000
            </p>
            <p className="text-gray-300 mb-2">
              <strong>Eye Color:</strong> Brown
            </p>
            <p className="text-gray-300 mb-2">
              <strong>Max Bench:</strong> 135 lbs
            </p>
            <p className="text-gray-300 mb-2">
              <strong>Favourite Movie:</strong> The Matrix, Rush Hour
            </p>
          </div>
          <div className="w-[3/4] flex justify-center space-x-4 mt-4">
           
            <button
              onClick={() => setShowExperience(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Experience
            </button>
            <button
              onClick={() => setShowEducation(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Education
            </button>
          </div>
          <div className="w-[3/4] flex space-x-4 mt-4">
            <button
              onClick={() => setShowAboutMe(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Experience Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center ${
          showExperience ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            Experience
          </h2>
          <div className="w-full text-left">
            <Image
              src="/images/outrider.jpeg"
              alt="Experience"
              width={150}
              height={150}
              className="mx-auto mb-4 rounded"
            />
            <p className="text-gray-300">
              {/* Replace with your actual experience details */}
              I have over 3 years of experience working on cutting-edge software development projects, specializing in scalable web applications and innovative robotics solutions.
            </p>
          </div>
          <button
            onClick={() => setShowExperience(false)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded self-center"
          >
            Back
          </button>
        </div>
      </div>

      {/* Education Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center ${
          showEducation ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            Education
          </h2>
          <div className="w-full text-left">
            <Image
              src="/images/umass.png"
              alt="Education"
              width={150}
              height={150}
              className="mx-auto mb-4 rounded"
            />
            <p className="text-gray-300">
              {/* Replace with your actual education details */}
              I earned a Bachelor's in Computer Science from the University of Massachusetts, Amherst, basically the Hogwarts of coding, where I learned to turn caffeine into code and mastered the magical arts of software engineering.
            </p>
          </div>
          <button
            onClick={() => setShowEducation(false)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded self-center"
          >
            Back
          </button>
        </div>
      </div>

      {/* Socials Overlay */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-in-out flex items-center justify-center ${
          showSocials ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            Socials
          </h2>
          <div className="flex flex-col space-y-4">
            <button
                onClick={() =>
                window.open("https://www.linkedin.com/in/shubh-vashisht/", "_blank")
                }
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded"
            >
                <FaLinkedin className="w-6 h-6" />
                <span>LinkedIn</span>
            </button>
            <button
                onClick={() =>
                window.open("https://github.com/shubh-vashisht", "_blank")
                }
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-blue-900 text-white rounded"
            >
                <FaGithub className="w-6 h-6" />
                <span>Github</span>
            </button>
            <button
                onClick={() =>
                window.open("https://www.youtube.com/@shubhy4628", "_blank")
                }
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded"
            >
                <FaYoutube className="w-6 h-6" />
                <span>Youtube</span>
            </button>
            <a
                href="/resume.pdf"
                download
                className="flex items-center justify-center space-x-2 block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
                <FaFileDownload className="w-6 h-6" />
                <span>Download Resume</span>
            </a>
            <button
                onClick={() => setShowContact(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-white hover:bg-gray-400 text-black rounded"
            >
                <FaEnvelope className="w-6 h-6" />
                <span>Contact Me</span>
            </button>
          </div>
          <button
            onClick={() => setShowSocials(false)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded self-center"
          >
            Back
          </button>
        </div>
      </div>

      {/* Contact Modal Overlay */}
      {showContact && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
              Contact Me
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // For sending an email, you'll need a backend or third-party service.
                // Example: using Formspree or EmailJS.
                setShowContact(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-800 mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full border border-gray-300 p-2 rounded text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-800 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full border border-gray-300 p-2 rounded text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-800 mb-1" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  className="w-full border border-gray-300 p-2 rounded text-gray-800"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Submit
              </button>
            </form>
            <button
              onClick={() => setShowContact(false)}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded w-full"
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
