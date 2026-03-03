"use client";

import dynamic from "next/dynamic";

const Insights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false }
);

export function SpeedInsightsClient() {
  return <Insights />;
}
