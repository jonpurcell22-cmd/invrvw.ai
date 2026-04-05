import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tryGetSupabasePublicConfig } from "@/lib/supabase";

/** Routes that require a REAL (non-anonymous) account */
const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/admin"];

/** Routes that need at least an anonymous session */
const SESSION_PREFIXES = ["/session"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const cfg = tryGetSupabasePublicConfig();

  if (!cfg) {
    console.error(
      "middleware: invalid Supabase env. Set NEXT_PUBLIC_SUPABASE_URL (https://…supabase.co) and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See [supabase] log above for details.",
    );
    if (matchesPrefix(pathname, AUTH_REQUIRED_PREFIXES)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthed = !error && Boolean(data?.claims?.sub);
  const isAnonymous =
    isAuthed &&
    (data?.claims as Record<string, unknown>)?.is_anonymous === true;
  const isRealUser = isAuthed && !isAnonymous;

  // Dashboard and admin require a real (non-anonymous) account
  if (matchesPrefix(pathname, AUTH_REQUIRED_PREFIXES) && !isRealUser) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  // Admin routes: restrict to ADMIN_EMAIL
  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath && isRealUser) {
    const email = (data?.claims as Record<string, unknown>)?.email as
      | string
      | undefined;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || email !== adminEmail) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Session routes: auto-create anonymous session if no auth
  if (matchesPrefix(pathname, SESSION_PREFIXES) && !isAuthed) {
    await supabase.auth.signInAnonymously();
  }

  // Redirect logged-in real users away from login/signup
  if ((pathname === "/login" || pathname === "/signup") && isRealUser) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip API: multipart POSTs through middleware/proxy can break body parsing
    // ("Failed to parse body as FormData"). API routes auth via cookies in handlers.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
