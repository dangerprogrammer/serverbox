import "server-only";

import { getAuthenticatedAdminFromToken, getSessionTokenFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const administrator = await getAuthenticatedAdminFromToken(
    getSessionTokenFromRequest(request),
  );

  if (!administrator) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    administrator: {
      id: administrator.id,
      name: administrator.name,
      email: administrator.email,
    },
  });
}
