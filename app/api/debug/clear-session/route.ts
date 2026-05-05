import "server-only";

import { deleteAdminSession, getSessionTokenFromRequest } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPaymentEntity } from "@/lib/db/entities/condominium-payment.entity";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionToken?: string;
    };

    const sessionToken = String(body.sessionToken ?? getSessionTokenFromRequest(request) ?? "").trim();

    if (sessionToken) {
      await deleteAdminSession(sessionToken);
    }

    const dataSource = await getDataSource();
    const adminRepo = dataSource.getRepository(AdministratorEntity);
    const condoRepo = dataSource.getRepository(CondominiumEntity);
    const paymentRepo = dataSource.getRepository(CondominiumPaymentEntity);

    return Response.json({
      clearedSessionToken: Boolean(sessionToken),
      administrators: await adminRepo.count(),
      condominiums: await condoRepo.count(),
      payments: await paymentRepo.count(),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
