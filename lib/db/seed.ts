import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { hashPassword } from "@/lib/auth/password";
import type { DataSource } from "typeorm";

const administratorSeed = {
  name: "Operacao ServerBox",
  email: "admin@serverbox.local",
};

function getSeedAdminPasswordHash() {
  const password = process.env.ADMIN_DEFAULT_PASSWORD?.trim() || "admin123456";

  return hashPassword(password);
}

export async function seedDatabase(dataSource: DataSource) {
  const administratorRepository = dataSource.getRepository(AdministratorEntity);

  let administrator = await administratorRepository.findOneBy({
    email: administratorSeed.email,
  });

  if (!administrator) {
    administrator = await administratorRepository.save({
      ...administratorSeed,
      passwordHash: getSeedAdminPasswordHash(),
    });
  } else if (!administrator.passwordHash) {
    administrator.passwordHash = getSeedAdminPasswordHash();
    administrator = await administratorRepository.save(administrator);
  }
}
