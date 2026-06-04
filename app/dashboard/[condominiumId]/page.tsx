import { redirect } from "next/navigation";

export default async function CondominiumDashboardRedirect({
  params,
}: {
  params: Promise<{ condominiumId: string }>;
}) {
  const { condominiumId } = await params;

  redirect(`/condominio/${condominiumId}`);
}
