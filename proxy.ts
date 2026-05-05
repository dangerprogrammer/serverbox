import { NextResponse, type NextRequest } from "next/server";

import { getDataSource } from "@/lib/db/data-source";
import { AdminSessionEntity } from "@/lib/db/entities/admin-session.entity";

const protectedRoutes = ["/dashboard", "/gerenciar-condominios"];
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const sessionCookie = request.cookies.get("serverbox_admin_session")?.value;
  let session: { adminId?: string } | null = null;

  if (sessionCookie) {
    try {
      const dataSource = await getDataSource();
      const sessionRepo = dataSource.getRepository(AdminSessionEntity);
      const entry = await sessionRepo.findOneBy({ id: sessionCookie });

      if (entry && entry.expiresAt.getTime() > Date.now()) {
        session = { adminId: entry.adminId };
      }
    } catch {
      session = null;
    }
  }

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
