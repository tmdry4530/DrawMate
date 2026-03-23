import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const authEntryPaths = ["/sign-in", "/sign-up"];
  const protectedPrefixes = [
    "/studio",
    "/messages",
    "/notifications",
    "/bookmarks",
    "/settings",
    "/onboarding",
  ];
  const isProtectedPage = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthEntryPage = authEntryPaths.includes(pathname);

  if (isAuthEntryPage && user) {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const safeNext =
      requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  if (isProtectedPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      const destination = `${pathname}${request.nextUrl.search}`;
      url.searchParams.set("next", destination);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
