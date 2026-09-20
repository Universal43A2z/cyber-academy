import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard", "/mentor"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Fetch the session without persisting — read-only cookie access.
  //    Missing env vars short-circuit to allow (build/storybook safety).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  let user: import("@supabase/supabase-js").User | null = null;
  if (hasSessionCookie) {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  }

  const isProtected =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth/session") ||
    pathname.startsWith("/api/attendance") ||
    pathname.startsWith("/api/quiz/submit");

  // 2. Unauthenticated users for protected areas -> auth.
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Mentor-only areas -> mentees get bounced to their dashboard.
  const isMentorArea = pathname.startsWith("/mentor");
  if (isMentorArea && user) {
    const role = user.user_metadata?.role ?? "mentee";
    if (role !== "mentor") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // 4. Authenticated users visiting the auth page -> dashboard.
  if (pathname === "/auth" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|f1-stackmind-logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};