import { NextResponse, type NextRequest } from "next/server";

import { getAdminSessionFromRaw } from "@/lib/auth/session";

const protectedRoutes = ["/dashboard", "/gerenciar-condominios"];
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const session = getAdminSessionFromRaw(
    request.cookies.get("serverbox_admin_session")?.value,
  );

  if (isProtectedRoute && !session?.adminId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session?.adminId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
