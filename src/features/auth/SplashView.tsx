import { ActivityIndicator, Image, Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, useTheme } from "../../shared/theme";

/** Màn hình chờ khi khôi phục phiên đăng nhập. */
export function SplashView() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.root} accessibilityLabel={t("common.loading")}>
      <View style={styles.logo}>
        <Image source={require("../../../assets/brand-logo.png")} style={{ width: 44, height: 44 }} resizeMode="contain" />
      </View>
      <Text style={styles.name}>KTX DN</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  name: { marginTop: 14, fontSize: 18, fontWeight: "800", color: colors.ink },
}));
