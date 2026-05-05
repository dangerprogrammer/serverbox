import "server-only";

import { deleteAdminSession } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPaymentEntity } from "@/lib/db/entities/condominium-payment.entity";

export async function GET() {
  try {
    await deleteAdminSession();

    const dataSource = await getDataSource();
    const adminRepo = dataSource.getRepository(AdministratorEntity);
    const condoRepo = dataSource.getRepository(CondominiumEntity);
    const paymentRepo = dataSource.getRepository(CondominiumPaymentEntity);

    const admins = await adminRepo.count();
    const condos = await condoRepo.count();
    const payments = await paymentRepo.count();

    const latestCondominium = (await condoRepo.find({
      order: { updatedAt: "DESC" as const },
      take: 1,
    }))[0] || null;

    return Response.json({
      clearedSessionCookie: true,
      administrators: admins,
      condominiums: condos,
      payments,
      latestCondominium,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
