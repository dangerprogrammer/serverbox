import { EntitySchema } from "typeorm";

export type CondominiumClientSession = {
  id: string;
  accessId: string;
  condominiumId: string;
  expiresAt: Date;
  createdAt: Date;
};

export const CondominiumClientSessionEntity =
  new EntitySchema<CondominiumClientSession>({
    name: "CondominiumClientSession",
    tableName: "condominium_client_sessions",
    columns: {
      id: {
        type: "uuid",
        primary: true,
        generated: "uuid",
      },
      accessId: {
        type: "uuid",
      },
      condominiumId: {
        type: "uuid",
      },
      expiresAt: {
        type: Date,
      },
      createdAt: {
        type: Date,
        createDate: true,
      },
    },
  });
