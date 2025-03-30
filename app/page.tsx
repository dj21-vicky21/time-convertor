"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/converter");
  }, [router]);

  return (
    <div>
      <Button onClick={() => router.push("/converter")}>Click</Button>
    </div>
  );
}

export default Home;
