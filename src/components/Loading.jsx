import React from 'react';
import { useRef } from "react";
function HomePage() {
  const userRef = useRef(null);
}
const Loader = ({ isDarkMode }) => {
  return (
    <>
      <style>
        {`
        @keyframes bounceCustom {
          0% {
            top: 60px;
            height: 5px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1.7);
          }
          40% {
            height: 20px;
            border-radius: 50%;
            transform: scaleX(1);
          }
          100% {
            top: 0%;
          }
        }

        @keyframes shadowCustom {
          0% {
            transform: scaleX(1.5);
          }
          40% {
            transform: scaleX(1);
            opacity: 0.7;
          }
          100% {
            transform: scaleX(0.2);
            opacity: 0.4;
          }
        }

        .animate-bounce-custom {
          animation: bounceCustom 0.5s alternate infinite ease-in-out;
        }

        .animate-shadow-custom {
          animation: shadowCustom 0.5s alternate infinite ease-in-out;
        }
        `}
      </style>

      <div
        className={`fixed inset-0 flex items-center justify-center z-50 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f3f4f6]'
          }`}
      >
        <div className="relative w-[200px] h-[60px]">
          {/* Circles */}
          <div
            className={`absolute w-5 h-5 rounded-full left-[15%] animate-bounce-custom delay-[0s] ${isDarkMode ? 'bg-white' : 'bg-gray-800'
              }`}
          />
          <div
            className={`absolute w-5 h-5 rounded-full left-[45%] animate-bounce-custom delay-[0.2s] ${isDarkMode ? 'bg-white' : 'bg-gray-800'
              }`}
          />
          <div
            className={`absolute w-5 h-5 rounded-full right-[15%] animate-bounce-custom delay-[0.3s] ${isDarkMode ? 'bg-white' : 'bg-gray-800'
              }`}
          />

          {/* Shadows */}
          <div
            className={`absolute w-5 h-1 rounded-full opacity-90 blur-sm top-[62px] left-[15%] -z-10 animate-shadow-custom delay-[0s] ${isDarkMode ? 'bg-black' : 'bg-gray-500'
              }`}
          />
          <div
            className={`absolute w-5 h-1 rounded-full opacity-90 blur-sm top-[62px] left-[45%] -z-10 animate-shadow-custom delay-[0.2s] ${isDarkMode ? 'bg-black' : 'bg-gray-500'
              }`}
          />
          <div
            className={`absolute w-5 h-1 rounded-full opacity-90 blur-sm top-[62px] right-[15%] -z-10 animate-shadow-custom delay-[0.3s] ${isDarkMode ? 'bg-black' : 'bg-gray-500'
              }`}
          />
        </div>
      </div>
    </>
  );
};

export default Loader;