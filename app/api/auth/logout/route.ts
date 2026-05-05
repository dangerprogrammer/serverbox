import "server-only";

import { deleteAdminSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionToken?: string;
    };

    const sessionToken = String(body.sessionToken ?? "").trim();

    if (sessionToken) {
      await deleteAdminSession(sessionToken);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao sair." },
      { status: 500 },
    );
  }
}
