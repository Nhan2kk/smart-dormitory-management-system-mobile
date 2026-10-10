import { useLocalSearchParams } from "expo-router";
import { BillPaymentScreen } from "./BillPaymentScreen";
import { RegistrationPaymentScreen } from "./RegistrationPaymentScreen";

/**
 * Màn thanh toán QR SePay (`/debts/pay/[id]`):
 * - đơn đăng ký KTX (`registrationId`): QR trong thời gian giữ chỗ 24 giờ;
 * - hoá đơn phát sinh (`billId`, hoặc `id` khi mở từ thông báo): QR 15 phút, không có hạn giữ chỗ.
 * Chỉ webhook SePay đã xác thực mới xác nhận thanh toán; sinh viên không tự xác nhận.
 */
export function PaymentScreen() {
  const { id, registrationId, billId, title } = useLocalSearchParams<{
    id: string;
    registrationId?: string;
    billId?: string;
    title?: string;
  }>();
  return registrationId ? (
    <RegistrationPaymentScreen registrationId={String(registrationId)} />
  ) : (
    <BillPaymentScreen billId={String(billId ?? id)} title={title ? String(title) : undefined} />
  );
}
