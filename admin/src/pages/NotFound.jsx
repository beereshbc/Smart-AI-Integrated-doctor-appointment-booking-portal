import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Notfound = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] text-center px-4 bg-slate-100 overflow-hidden">
      {/* Floating background blobs */}
      <motion.div
        className="absolute top-0 -left-12 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{ y: [0, 30, 0], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <motion.div
        className="absolute top-20 -right-12 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{ y: [0, -25, 0], x: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <motion.div
        className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{ y: [0, 40, 0], x: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>

      {/* Card with entrance animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl p-8 space-y-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl"
      >
        {/* Emoji with subtle bounce */}
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          🩺
        </motion.div>

        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
          404
        </h1>
        <h2 className="text-3xl font-bold text-slate-800">Page Not Found</h2>

        <p className="text-slate-600 max-w-md mx-auto">
          Oops! The page you’re looking for seems to have been misplaced. It might have been moved, deleted, or perhaps it's just on a coffee break.
        </p>

        {/* Animated buttons */}
        <div className="flex gap-4 flex-wrap justify-center pt-4">
          <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/doctors"
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg border border-slate-300 shadow-md hover:border-blue-400 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find a Doctor
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Notfound;
