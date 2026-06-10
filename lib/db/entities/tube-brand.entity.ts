import { EntitySchema } from "typeorm";

import type { CondominiumCourt } from "@/lib/db/entities/condominium-court.entity";

export type TubeBrand = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  courts: CondominiumCourt[];
};

export const TubeBrandEntity = new EntitySchema<TubeBrand>({
  name: "TubeBrand",
  tableName: "tube_brands",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: String,
      unique: true,
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
    courts: {
      type: "one-to-many",
      target: "CondominiumCourt",
      inverseSide: "tubeBrand",
    },
  },
});
