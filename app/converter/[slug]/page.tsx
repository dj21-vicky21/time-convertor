import React from "react";
import TimeZoneApp from "./timeZoneApp";

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    return <TimeZoneApp slug={slug} />;
  } catch (error) {
    console.error("Error in page component:", error);
    // Return a fallback UI that won't redirect
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-red-800 font-bold mb-2">Error loading time zones</h2>
        <p>There was a problem loading the selected time zones.</p>
      </div>
    );
  }
}

export default Page;
