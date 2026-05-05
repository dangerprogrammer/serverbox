import { EntitySchema } from "typeorm";

export type AdminSession = {
  id: string;
  adminId: string;
  expiresAt: Date;
  createdAt: Date;
};

export const AdminSessionEntity = new EntitySchema<AdminSession>({
  name: "AdminSession",
  tableName: "admin_sessions",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    adminId: {
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
