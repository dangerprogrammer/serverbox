import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";

export type Administrator = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  condominiums: Condominium[];
};

export const AdministratorEntity = new EntitySchema<Administrator>({
  name: "Administrator",
  tableName: "administrators",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    passwordHash: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: Date,
      createDate: true,
    },
    updatedAt: {
      type: Date,
      updateDate: true,
    },
  },
  relations: {
    condominiums: {
      type: "one-to-many",
      target: "Condominium",
      inverseSide: "primaryAdmin",
    },
  },
});
