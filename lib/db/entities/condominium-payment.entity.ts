import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";

export enum PaymentMethod {
  PIX = "pix",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  EXPIRED = "expired",
  REFUNDED = "refunded",
}

export enum PaymentVerificationSource {
  WEBHOOK = "webhook",
  MANUAL_REVIEW = "manual_review",
  STATUS_CHECK = "status_check",
}

export type CondominiumPayment = {
  id: string;
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountInCents: number;
  ballQuantity: number;
  provider: string | null;
  providerPaymentId: string | null;
  providerRawStatus: string | null;
  providerReceiptUrl: string | null;
  providerDevMode: boolean | null;
  pixTransactionId: string | null;
  pixQrCode: string | null;
  pixCopyPasteCode: string | null;
  pixExpiresAt: Date | null;
  paidAt: Date | null;
  verifiedAt: Date | null;
  verificationSource: PaymentVerificationSource | null;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
  planId: string;
  planName: string;
};

export const CondominiumPaymentEntity = new EntitySchema<CondominiumPayment>({
  name: "CondominiumPayment",
  tableName: "condominium_payments",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    reference: {
      type: String,
      unique: true,
    },
    method: {
      type: String,
    },
    status: {
      type: String,
    },
    amountInCents: {
      type: Number,
    },
    ballQuantity: {
      type: Number,
    },
    planId: {
      type: String,
    },
    planName: {
      type: String,
    },
    provider: {
      type: String,
      nullable: true,
    },
    providerPaymentId: {
      type: String,
      unique: true,
      nullable: true,
    },
    providerRawStatus: {
      type: String,
      nullable: true,
    },
    providerReceiptUrl: {
      type: String,
      nullable: true,
    },
    providerDevMode: {
      type: Boolean,
      nullable: true,
    },
    pixTransactionId: {
      type: String,
      unique: true,
      nullable: true,
    },
    pixQrCode: {
      type: String,
      nullable: true,
    },
    pixCopyPasteCode: {
      type: String,
      nullable: true,
    },
    pixExpiresAt: {
      type: Date,
      nullable: true,
    },
    paidAt: {
      type: Date,
      nullable: true,
    },
    verifiedAt: {
      type: Date,
      nullable: true,
    },
    verificationSource: {
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
    condominium: {
      type: "many-to-one",
      target: "Condominium",
      inverseSide: "payments",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
