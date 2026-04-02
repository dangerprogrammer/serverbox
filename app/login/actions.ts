'use server';

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, deleteAdminSession } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";

type LoginState = {
  error?: string;
};

export async function loginAdmin(
  _state: LoginState | undefined,
  formData: FormData,
): Promise<LoginState | undefined> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return {
      error: "Informe email e senha para entrar.",
    };
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const administrator = await administratorRepository.findOneBy({ email });

  if (!administrator || !verifyPassword(password, administrator.passwordHash)) {
    return {
      error: "Credenciais invalidas.",
    };
  }

  await createAdminSession(administrator.id);
  redirect("/dashboard");
}

export async function logoutAdmin() {
  await deleteAdminSession();
  redirect("/login");
}
