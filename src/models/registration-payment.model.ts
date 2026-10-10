import type {
  PaymentAttemptStatus,
  RegistrationPaymentEventStatus,
} from "../enums/payment.enum";

export interface PaymentQr {
  registrationId: string;
  attemptId: string;
  paymentCode: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  qrImageUrl: string;
  qrExpiresAt: string;
  paymentDeadline: string;
  serverTime: string;
  attemptStatus: PaymentAttemptStatus;
  registrationStatus: string;
}

export interface PaymentStatus {
  registrationId: string;
  registrationStatus: string;
  attemptId: string | null;
  paymentCode: string | null;
  attemptStatus: PaymentAttemptStatus | null;
  qrExpiresAt: string | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  serverTime: string;
}

export interface RegistrationPaymentEvent {
  registrationId: string;
  attemptId: string | null;
  status: RegistrationPaymentEventStatus;
  registrationStatus: string;
  paidAt: string | null;
  amount: number;
}
