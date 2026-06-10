import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";
import type { TubeBrand } from "@/lib/db/entities/tube-brand.entity";

export type CondominiumCourt = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
  tubeBrand: TubeBrand;
  tubeBrands: TubeBrand[];
};

export const CondominiumCourtEntity = new EntitySchema<CondominiumCourt>({
  name: "CondominiumCourt",
  tableName: "condominium_courts",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: String,
    },
    sortOrder: {
      type: Number,
      default: 0,
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
      inverseSide: "courtDetails",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    tubeBrand: {
      type: "many-to-one",
      target: "TubeBrand",
      inverseSide: "courts",
      joinColumn: {
        name: "tubeBrandId",
      },
      nullable: false,
      onDelete: "RESTRICT",
    },
    tubeBrands: {
      type: "many-to-many",
      target: "TubeBrand",
      joinTable: {
        name: "condominium_court_tube_brands",
        joinColumn: {
          name: "courtId",
          referencedColumnName: "id",
        },
        inverseJoinColumn: {
          name: "tubeBrandId",
          referencedColumnName: "id",
        },
      },
    },
  },
});
