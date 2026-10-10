import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import type { TransferInfo } from "../../models/debt.model";
import { makeStyles, radius, spacing } from "../../shared/theme";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Card, useToast } from "../../shared/ui";

type BankApp = {
  appId: string;
  appLogo: string;
  appName: string;
  bankName: string;
  deeplink: string;
  autofill: number;
};

const COLLAPSED_COUNT = 8;
let cache: BankApp[] | null = null;
let bankCodes: { code: string; shortName: string }[] | null = null;

/** Đổi tên ngân hàng của SePay (vd. MBBank) sang mã VietQR (vd. mb) để ghép vào tham số `ba`. */
async function vietQrBankCode(name: string): Promise<string> {
  try {
    if (!bankCodes) {
      const response = await fetch("https://api.vietqr.io/v2/banks");
      bankCodes = ((await response.json()) as { data?: typeof bankCodes }).data ?? [];
    }
    const key = name.toLowerCase();
    const bank = bankCodes?.find(
      (item) => item.shortName.toLowerCase() === key || item.code.toLowerCase() === key,
    );
    return (bank?.code ?? name).toLowerCase();
  } catch {
    return name.toLowerCase();
  }
}

/** Danh sách app ngân hàng mở được qua VietQR (theo hệ điều hành), sắp theo mức phổ biến. */
async function loadBankApps(): Promise<BankApp[]> {
  if (cache) return cache;
  const os = Platform.OS === "ios" ? "ios" : "android";
  const response = await fetch(`https://api.vietqr.io/v2/${os}-app-deeplinks`);
  const data = (await response.json()) as { apps?: BankApp[] };
  cache = data.apps ?? [];
  return cache;
}

/**
 * Chọn ngân hàng để thanh toán như app bán lẻ: bấm vào ngân hàng thì mở app đó với
 * số tài khoản, số tiền và nội dung chuyển khoản đã điền sẵn (VietQR deep link).
 */
export function BankAppPicker({ qr }: { qr: TransferInfo }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const styles = useStyles();
  const [apps, setApps] = useState<BankApp[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    loadBankApps()
      .then((value) => active && setApps(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (apps.length === 0) return null;
  const visible = expanded ? apps : apps.slice(0, COLLAPSED_COUNT);

  const open = async (app: BankApp) => {
    // Trang chuyển hướng của VietQR chỉ mở app ngân hàng chứ không truyền số tiền/số tài khoản
    // sang app (kể cả app có autofill), nên sao chép số tài khoản để sinh viên chỉ cần dán.
    await Clipboard.setStringAsync(qr.accountNumber).catch(() => undefined);
    notify(t("payment.accountCopiedOpenBank"));
    const bank = await vietQrBankCode(qr.bankCode);
    const params = new URLSearchParams({
      ba: `${qr.accountNumber}@${bank}`,
      am: String(qr.amount),
      tn: qr.transferContent,
      bn: qr.accountHolder,
    });
    Linking.openURL(`${app.deeplink}&${params.toString()}`).catch(() =>
      notify(t("payment.openBankFailed"), "danger"),
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t("payment.chooseBank")}</Text>
      <View style={styles.grid}>
        {visible.map((app) => (
          <Pressable
            key={app.appId}
            style={styles.item}
            onPress={() => void open(app)}
            accessibilityRole="button"
            accessibilityLabel={app.appName.trim()}
          >
            <Image source={{ uri: app.appLogo }} style={styles.logo} />
            <Text style={styles.name} numberOfLines={2}>
              {app.appName.trim()}
            </Text>
          </Pressable>
        ))}
      </View>
      {apps.length > COLLAPSED_COUNT && (
        <Pressable onPress={() => setExpanded((value) => !value)}>
          <Text style={styles.more}>
            {expanded ? t("payment.showLess") : t("payment.showMore")}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: { gap: spacing.md },
  title: { fontWeight: "700", color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  item: { width: "25%", alignItems: "center", gap: 6, paddingHorizontal: 2 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  name: { fontSize: 11, textAlign: "center", color: colors.ink },
  more: { textAlign: "center", color: colors.primary, fontWeight: "600" },
}));
