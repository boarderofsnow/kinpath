import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { SpeedInsightsClient } from "@/components/analytics/speed-insights";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Kinpath | Evidence-Based Parenting Resources",
  description:
    "Personalized, evidence-based parenting resources from pregnancy through age 5. Adapted to your family's beliefs, lifestyle, and your child's age.",
  keywords: [
    "parenting",
    "pregnancy",
    "newborn",
    "baby",
    "toddler",
    "evidence-based",
    "resources",
  ],
  themeColor: "#f0eeec",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-900 focus:shadow-lg focus:ring-2 focus:ring-brand-500"
        >
          Skip to content
        </a>
        {children}
        <SpeedInsightsClient />
      </body>
    </html>
  );
}
