"use client";

import { useEffect, useState } from "react";

export default function MobileRedirectPage() {
  const [showFallback, setShowFallback] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      // No tokens — fall through to web onboarding
      window.location.href = "/onboarding";
      return;
    }

    const link = `kinpath-family://auth-callback#access_token=${accessToken}&refresh_token=${refreshToken}`;
    setDeepLink(link);

    // Attempt to open the mobile app
    window.location.href = link;

    // If still here after 2.5s, deep link likely failed (desktop / app not installed)
    const timer = setTimeout(() => setShowFallback(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white/80 p-8 text-center shadow-card backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <svg
              className="h-8 w-8 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3"
              />
            </svg>
          </div>

          <div>
            <h1 className="font-display text-xl font-semibold text-stone-900">
              Email Confirmed!
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Your email has been verified. Open the Kinpath app to continue
              setting up your account.
            </p>
          </div>

          <div className="space-y-3">
            {deepLink && (
              <a
                href={deepLink}
                className="block w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Open in Kinpath App
              </a>
            )}
            <a
              href="/onboarding"
              className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Continue on Web Instead
            </a>
          </div>

          <p className="text-xs text-stone-400">
            Don&apos;t have the app?{" "}
            <a href="/onboarding" className="text-brand-600 hover:underline">
              Complete setup here
            </a>
          </p>
        </div>
      </main>
    );
  }

  // Loading state while attempting deep link
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-sm text-stone-500">
          Redirecting to the Kinpath app&hellip;
        </p>
      </div>
    </main>
  );
}
