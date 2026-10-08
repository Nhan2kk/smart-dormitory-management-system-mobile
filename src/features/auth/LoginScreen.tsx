import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Button, CircleButton, Field, PhotoBackground, Touchable, useToast } from "../../shared/ui";
import { useAuth } from "./AuthProvider";
import { LanguageToggle } from "./LanguageToggle";

export function LoginScreen() {
  const { signIn, user } = useAuth();
  const { notify } = useToast();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  if (user) return <Redirect href="/" />;

  async function submit() {
    const nextErrors = {
      username: username.trim() ? undefined : t("auth.requiredCode"),
      password: password ? undefined : t("auth.requiredPassword"),
    };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) return;
    setSubmitting(true);
    try {
      await signIn(username, password);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : t("auth.failed"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <PhotoBackground source={Photos.marbleLobby()} shade style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.heroTop}>
              <CircleButton icon="chevron-back" label={t("common.back")} variant="photo" onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))} />
              <LanguageToggle />
            </View>
            <View style={{ gap: 4 }}>
              <View style={styles.logo}>
                <Image source={require("../../../assets/brand-logo.png")} style={{ width: 28, height: 28 }} resizeMode="contain" />
              </View>
              <Text style={styles.heroTitle}>{t("auth.welcomeBack")}</Text>
              <Text style={styles.heroSub}>{t("auth.portal")}</Text>
            </View>
          </PhotoBackground>

          <View style={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}>
            <Text style={styles.title} accessibilityRole="header">
              {t("auth.login")}
            </Text>
            <Text style={styles.subtitle}>{t("auth.loginHint")}</Text>

            <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
              <Field
                label={t("auth.studentCode")}
                icon="person-outline"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  if (errors.username) setErrors((current) => ({ ...current, username: undefined }));
                }}
                placeholder={t("auth.studentCodePlaceholder")}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="submit"
                error={errors.username}
              />
              <Field
                ref={passwordRef}
                label={t("auth.password")}
                icon="lock-closed-outline"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
                }}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry={!visible}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={errors.password}
                right={
                  <Touchable onPress={() => setVisible(!visible)} accessibilityLabel={visible ? t("auth.hidePassword") : t("auth.showPassword")} style={styles.eye}>
                    <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={21} color={colors.muted} />
                  </Touchable>
                }
              />
            </View>

            <Touchable onPress={() => notify(t("auth.forgotMessage"), "info")} accessibilityLabel={t("auth.forgot")} style={styles.forgot}>
              <Text style={styles.forgotText}>{t("auth.forgot")}</Text>
            </Touchable>

            <Button label={t("auth.login")} icon="arrow-forward" iconPosition="right" loading={submitting} onPress={submit} style={{ marginTop: spacing.xl }} />

            <View style={styles.secure}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={styles.secureText}>{t("auth.secure")}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 310, paddingHorizontal: spacing.xl, justifyContent: "space-between", paddingBottom: 56 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: "500" },
  form: { flex: 1, marginTop: -32, backgroundColor: colors.background, borderTopLeftRadius: radius.xl + 6, borderTopRightRadius: radius.xl + 6, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl + 4 },
  title: { ...font.display, fontSize: 28 },
  subtitle: { ...font.body, color: colors.muted, marginTop: 4 },
  eye: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: -8 },
  forgot: { alignSelf: "flex-end", paddingVertical: spacing.sm, marginTop: spacing.sm },
  forgotText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  secure: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.xl },
  secureText: { ...font.caption, flexShrink: 1 },
}));
