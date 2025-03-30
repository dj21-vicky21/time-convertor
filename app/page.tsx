"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/converter");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center animate-[fadeIn_0.3s_ease-out]">
        <div className="relative">
          <Clock className="w-16 h-16 text-primary animate-[pulse_1s_ease-in-out_infinite]" />
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
        
        <h1 className="mt-6 text-4xl font-bold text-foreground">
          Time Zone Converter
        </h1>
        
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full bg-primary animate-[bounce_0.3s_infinite_alternate] opacity-70`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
