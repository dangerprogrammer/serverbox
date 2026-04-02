import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CANCELED = "canceled",
}

export type Subscription = {
  id: string;
  status: SubscriptionStatus;
  startsAt: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
  planId: string;
  planName: string;
};

export const SubscriptionEntity = new EntitySchema<Subscription>({
  name: "Subscription",
  tableName: "subscriptions",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    status: {
      type: String,
    },
    startsAt: {
      type: "date",
    },
    notes: {
      type: "text",
      nullable: true,
    },
    planId: {
      type: String,
    },
    planName: {
      type: String,
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
      inverseSide: "subscriptions",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
