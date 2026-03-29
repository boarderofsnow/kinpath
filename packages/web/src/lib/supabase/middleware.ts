import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is critical for keeping the auth token alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except public routes)
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/callback", "/api/auth/callback", "/auth/forgot-password", "/auth/reset-password", "/privacy", "/terms", "/support"];
  const isPublicRoute =
    publicRoutes.some((route) => request.nextUrl.pathname === route) ||
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname.startsWith("/pricing");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users who haven't completed onboarding to /onboarding.
  // Skip: public routes, /onboarding itself, API routes, auth routes, static assets.
  if (user) {
    const pathname = request.nextUrl.pathname;
    const skipOnboardingCheck =
      isPublicRoute ||
      pathname === "/onboarding" ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/auth/") ||
      pathname.startsWith("/_next/");

    if (!skipOnboardingCheck) {
      // Use a cookie to avoid repeated DB queries — once onboarding is complete, cache it
      const onboardingCookie = request.cookies.get("onboarding_complete");
      if (onboardingCookie?.value !== "true") {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_complete")
          .eq("id", user.id)
          .single();

        if (profile?.onboarding_complete) {
          // Cache in cookie so we don't query again
          supabaseResponse.cookies.set("onboarding_complete", "true", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
          });
        } else {
          const url = request.nextUrl.clone();
          url.pathname = "/onboarding";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
