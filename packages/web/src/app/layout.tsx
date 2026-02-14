import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KinPath — Evidence-Based Parenting Resources",
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
