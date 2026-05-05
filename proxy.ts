import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/gerenciar-condominios"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const sessionCookie = request.cookies.get("serverbox_admin_session")?.value;

  // Keep middleware checks cookie-based only.
  // Full session validation is done in server actions/pages, avoiding Edge/DB drift on Vercel.
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
