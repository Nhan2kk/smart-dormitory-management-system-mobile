export type RoomUtilityAccount = {
  roomId: string;
  roomCode: string;
  representativeId: string | null;
  representativeName: string;
  proposedRepresentativeId: string | null;
  members: { id: string; name: string }[];
  lastClosedAt: string | null;
  debtConfirmedAt: string | null;
  debtResolution: string | null;
};
export type RoomUtilityBill = {
  id: string;
  roomId: string;
  roomCode: string;
  periodFrom: string;
  periodTo: string;
  dueAt: string;
  representativeId: string | null;
  representativeName: string;
  electricityKwh: number;
  waterM3: number;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
  canPay: boolean;
  pricingSnapshot: string;
};
export type RoomUtilitySchedule = {
  id: string;
  closeDay: number;
  closeHour: number;
  paymentDays: number;
  dueHour: number;
  automaticIssue: boolean;
  effectiveFrom: string;
};
export type RoomUtilityPreview = {
  account: RoomUtilityAccount;
  from: string;
  to: string;
  dueAt: string;
  electricityKwh: number;
  waterM3: number;
  amount: number;
  pricingSnapshot: string;
};
export type RoomUtilityHandover = {
  id: string;
  previousRepresentativeId: string | null;
  representativeId: string;
  actorId: string;
  action: string;
  createdAt: string;
};
