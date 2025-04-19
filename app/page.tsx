"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to converter page after a short delay
    const timer = setTimeout(() => {
      router.push("/converter");
    }, 500);
    
    // Clean up timer
    return () => clearTimeout(timer);
  }, [router]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <div className="text-center relative z-10">
        {/* Clock icon with pulse effect */}
        <div className="relative inline-flex mb-8">
          <div className="relative size-24 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            {/* Hour hand */}
            <div className="w-1 h-10 bg-gray-600 origin-bottom absolute rounded-full animate-[spin_10s_linear_infinite] top-[8px]"></div>
            {/* Minute hand */}
            <div className="w-1 h-7 bg-gray-800 origin-bottom absolute rounded-full animate-[spin_60s_linear_infinite] top-[20px]"></div>
            {/* Center dot */}
            <div className="w-2 h-2 rounded-full bg-gray-900 absolute"></div>
          </div>
        </div>
        
        {/* Loading title */}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Time Zone Converter
        </h1>
        
        <p className="text-gray-500 mb-6">Loading...</p>
        
        {/* Loading dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400 animate-[pulse_1s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
