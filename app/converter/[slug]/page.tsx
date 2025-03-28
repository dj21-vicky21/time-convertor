import React from "react";
import TimeZoneApp from "./timeZoneApp";

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TimeZoneApp slug={slug} />;
}

export default Page;
