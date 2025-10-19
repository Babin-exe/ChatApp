import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex flex-col justify-center items-center px-6 text-center overflow-hidden">
      <div className="w-full max-w-4xl mx-auto flex flex-col justify-center items-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Welcome to ChatApp 💬
        </h1>

        <p className="text-base sm:text-lg md:text-xl mb-8 max-w-md opacity-90">
          Connect with your friends securely and instantly — anytime, anywhere.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link
            to="/signup"
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition shadow-md text-sm sm:text-base"
          >
            Sign Up
          </Link>

          <Link
            to="/login"
            className="px-8 py-3 border border-white rounded-xl hover:bg-white hover:text-indigo-600 transition shadow-md text-sm sm:text-base"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
