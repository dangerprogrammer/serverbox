import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";

export type CondominiumClientAccess = {
  id: string;
  username: string;
  displayName: string | null;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
};

export const CondominiumClientAccessEntity =
  new EntitySchema<CondominiumClientAccess>({
    name: "CondominiumClientAccess",
    tableName: "condominium_client_accesses",
    columns: {
      id: {
        type: "uuid",
        primary: true,
        generated: "uuid",
      },
      username: {
        type: String,
        unique: true,
      },
      displayName: {
        type: String,
        nullable: true,
      },
      passwordHash: {
        type: String,
      },
      isActive: {
        type: Boolean,
        default: true,
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
      condominium: {
        type: "many-to-one",
        target: "Condominium",
        inverseSide: "clientAccesses",
        joinColumn: {
          name: "condominiumId",
        },
        nullable: false,
        onDelete: "CASCADE",
      },
    },
  });
