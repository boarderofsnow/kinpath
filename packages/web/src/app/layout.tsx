import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false }
);

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
  title: "KinPath | Evidence-Based Parenting Resources",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
