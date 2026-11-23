import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasswordResetStep } from "../../enums/password-reset.enum";
import type { PasswordResetStart } from "../../models/password-reset.model";
import { AuthService } from "../../services/auth.service";
import { ApiError, errorMessage } from "../../shared/api";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Button, CircleButton, Field, PhotoBackground, StepProgress, Touchable, useToast } from "../../shared/ui";
import { LanguageToggle } from "./LanguageToggle";

/** Thời gian chờ trước khi được gửi lại mã (khớp cấu hình mặc định của server). */
const RESEND_SECONDS = 60;
/** Quy tắc mật khẩu giống server: 8–72 ký tự, có cả chữ và số. */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const EMAIL_RULE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Errors = Partial<Record<"username" | "email" | "otp" | "password" | "confirm", string>>;

/** Đồng hồ đếm ngược theo giây, dừng ở 0. */
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Quên mật khẩu: (1) nhập MSSV + email đã đăng ký, server kiểm tra email đúng của tài khoản rồi gửi mã 6 số;
 * (2) nhập mã; (3) đặt mật khẩu mới. Xong thì mọi thiết bị bị đăng xuất và quay về màn đăng nhập.
 */
export function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ username?: string }>();
  const { notify } = useToast();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(PasswordResetStep.Email);
  const [username, setUsername] = useState(params.username ?? "");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [session, setSession] = useState<PasswordResetStart | null>(null);
  const [expiresIn, setExpiresIn] = useCountdown();
  const [resendIn, setResendIn] = useCountdown();

  const clearError = (key: keyof Errors) => errors[key] && setErrors((current) => ({ ...current, [key]: undefined }));
  const back = () => {
    if (step > PasswordResetStep.Email) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/login");
  };

  async function sendCode() {
    const next: Errors = {
      username: username.trim() ? undefined : t("auth.requiredCode"),
      email: EMAIL_RULE.test(email.trim()) ? undefined : t("auth.reset.invalidEmail"),
    };
    setErrors(next);
    if (next.username || next.email) return;
    setBusy(true);
    try {
      const started = await AuthService.startPasswordReset(email.trim(), username.trim());
      setSession(started);
      setExpiresIn(started.expiresInSeconds);
      setResendIn(RESEND_SECONDS);
      setOtp("");
      setStep(PasswordResetStep.Code);
      notify(t("auth.reset.codeSent", { email: started.maskedDestination }), "success");
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setBusy(false);
    }
  }

  function checkCode() {
    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: t("auth.reset.invalidCode") });
      return;
    }
    if (expiresIn <= 0) {
      notify(t("auth.reset.codeExpired"), "warning");
      return;
    }
    setErrors({});
    setStep(PasswordResetStep.Password);
  }

  async function savePassword() {
    const next: Errors = {
      password: PASSWORD_RULE.test(password) ? undefined : t("auth.reset.passwordRule"),
      confirm: confirm === password ? undefined : t("auth.reset.passwordMismatch"),
    };
    setErrors(next);
    if (next.password || next.confirm || !session) return;
    setBusy(true);
    try {
      await AuthService.confirmPasswordReset({ requestId: session.requestId, otp, newPassword: password, confirmPassword: confirm });
      notify(t("auth.reset.done"), "success");
      router.replace("/login");
    } catch (error) {
      notify(errorMessage(error), "danger");
      // Mã sai/hết hạn → nhập lại mã; sai quá số lần → phải xin mã mới.
      const code = error instanceof ApiError ? error.code : undefined;
      if (code === "RESET_CODE_INVALID") setStep(PasswordResetStep.Code);
      if (code === "RESET_ATTEMPTS_EXCEEDED") setStep(PasswordResetStep.Email);
    } finally {
      setBusy(false);
    }
  }

  const eye = (
    <Touchable onPress={() => setVisible(!visible)} accessibilityLabel={visible ? t("auth.hidePassword") : t("auth.showPassword")} style={styles.eye}>
      <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={21} color={colors.muted} />
    </Touchable>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <PhotoBackground source={Photos.marbleLobby()} shade style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.heroTop}>
              <CircleButton icon="chevron-back" label={t("common.back")} variant="photo" onPress={back} />
              <LanguageToggle />
            </View>
            <View style={{ gap: 4 }}>
              <View style={styles.logo}>
                <Ionicons name="key-outline" size={24} color={colors.white} />
              </View>
              <Text style={styles.heroTitle}>{t("auth.reset.title")}</Text>
              <Text style={styles.heroSub}>{t("auth.portal")}</Text>
            </View>
          </PhotoBackground>

          <View style={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}>
            <StepProgress steps={[t("auth.reset.stepAccount"), t("auth.reset.stepCode"), t("auth.reset.stepPassword")]} current={step} />

            {step === PasswordResetStep.Email && (
              <View style={styles.section}>
                <Text style={styles.hint}>{t("auth.reset.accountHint")}</Text>
                <Field
                  label={t("auth.studentCode")}
                  icon="person-outline"
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);
                    clearError("username");
                  }}
                  placeholder={t("auth.studentCodePlaceholder")}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  error={errors.username}
                />
                <Field
                  label={t("auth.reset.email")}
                  icon="mail-outline"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError("email");
                  }}
                  placeholder={t("auth.reset.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={sendCode}
                  error={errors.email}
                />
                <Button label={t("auth.reset.sendCode")} icon="send" loading={busy} onPress={sendCode} style={styles.action} />
              </View>
            )}

            {step === PasswordResetStep.Code && session && (
              <View style={styles.section}>
                <Text style={styles.hint}>{t("auth.reset.codeHint", { email: session.maskedDestination })}</Text>
                <Field
                  label={t("auth.reset.code")}
                  icon="keypad-outline"
                  value={otp}
                  onChangeText={(value) => {
                    setOtp(value.replace(/\D/g, "").slice(0, 6));
                    clearError("otp");
                  }}
                  placeholder="••••••"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  returnKeyType="next"
                  onSubmitEditing={checkCode}
                  error={errors.otp}
                  style={styles.otp}
                />
                <View style={styles.codeMeta}>
                  <Text style={[styles.meta, expiresIn <= 0 && { color: colors.danger }]}>
                    {expiresIn > 0 ? t("auth.reset.expiresIn", { time: clock(expiresIn) }) : t("auth.reset.codeExpired")}
                  </Text>
                  <Touchable onPress={sendCode} disabled={resendIn > 0 || busy} accessibilityLabel={t("auth.reset.resend")}>
                    <Text style={[styles.resend, resendIn > 0 && { color: colors.muted }]}>
                      {resendIn > 0 ? t("auth.reset.resendIn", { seconds: resendIn }) : t("auth.reset.resend")}
                    </Text>
                  </Touchable>
                </View>
                <Button label={t("auth.reset.continue")} icon="arrow-forward" iconPosition="right" onPress={checkCode} style={styles.action} />
              </View>
            )}

            {step === PasswordResetStep.Password && (
              <View style={styles.section}>
                <Text style={styles.hint}>{t("auth.reset.passwordHint")}</Text>
                <Field
                  label={t("auth.reset.newPassword")}
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError("password");
                  }}
                  secureTextEntry={!visible}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  error={errors.password}
                  hint={errors.password ? undefined : t("auth.reset.passwordRule")}
                  right={eye}
                />
                <Field
                  label={t("auth.reset.confirmPassword")}
                  icon="lock-closed-outline"
                  value={confirm}
                  onChangeText={(value) => {
                    setConfirm(value);
                    clearError("confirm");
                  }}
                  secureTextEntry={!visible}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={savePassword}
                  error={errors.confirm}
                />
                <Button label={t("auth.reset.save")} icon="checkmark" loading={busy} onPress={savePassword} style={styles.action} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 280, paddingHorizontal: spacing.xl, justifyContent: "space-between", paddingBottom: 56 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: "500" },
  form: { flex: 1, marginTop: -32, backgroundColor: colors.background, borderTopLeftRadius: radius.xl + 6, borderTopRightRadius: radius.xl + 6, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl },
  section: { gap: spacing.lg, marginTop: spacing.xl },
  hint: { ...font.body, color: colors.muted },
  action: { marginTop: spacing.sm },
  eye: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: -8 },
  otp: { fontSize: 22, letterSpacing: 8, fontWeight: "700" },
  codeMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -spacing.sm },
  meta: { ...font.caption },
  resend: { color: colors.primary, fontWeight: "700", fontSize: 14, paddingVertical: spacing.xs },
}));
