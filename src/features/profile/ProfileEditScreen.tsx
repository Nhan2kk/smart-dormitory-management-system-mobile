import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, ChipGroup, Field, IconBadge, InfoRow, ListRow, Screen, SectionHeader, Touchable, useToast } from "../../shared/ui";
import { Gender } from "../../enums/profile.enum";
import type { PasswordDraft, StudentProfileResponse } from "../../models/profile.model";
import { useAuth } from "../auth/AuthProvider";
import { useProfile } from "./useProfile";

type Tab = "contact" | "personal" | "identity" | "study" | "account";

const EMPTY_PASSWORDS: PasswordDraft = { current: "", next: "", confirm: "" };

/** Thông tin cá nhân của sinh viên (`GET /student/profile`, chỉ xem) và đổi mật khẩu (`POST /auth/change-password`). */
export function ProfileEditScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { profile, error, loading, reload, service } = useProfile();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? "contact");

  return (
    <Screen header={<AppHeader title={t("profileEdit.title")} />}>
      <ChipGroup<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "contact", label: t("profileEdit.tabs.contact"), icon: "call-outline" },
          { value: "personal", label: t("profileEdit.tabs.personal"), icon: "person-outline" },
          { value: "identity", label: t("profileEdit.tabs.identity"), icon: "id-card-outline" },
          { value: "study", label: t("profileEdit.tabs.study"), icon: "school-outline" },
          { value: "account", label: t("profileEdit.tabs.account"), icon: "lock-closed-outline" },
        ]}
      />
      {tab === "account" ? (
        <AccountTab service={service} />
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : profile ? (
        <ProfileTab tab={tab} profile={profile} />
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <Callout tone="danger" icon="cloud-offline-outline" title={t("profileEdit.loadError")} action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />}>
            {error}
          </Callout>
        </View>
      )}
    </Screen>
  );
}

function ProfileTab({ tab, profile }: { tab: Exclude<Tab, "account">; profile: StudentProfileResponse }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const date = (value: string | null) => (value ? Formatter.date(value) : null);
  const gender = profile.gender === Gender.Male || profile.gender === Gender.Female ? t(`common.${profile.gender}`) : null;

  return (
    <>
      {tab === "contact" && (
        <>
          <ReadonlyCard
            rows={[
              [t("profileEdit.phone"), profile.phone],
              [t("profileEdit.email"), profile.email],
              [t("profileEdit.permanentAddress"), profile.address],
              [t("profileEdit.currentAddress"), profile.contactAddress],
            ]}
          />

          <SectionHeader title={t("profileEdit.emergency")} />
          {profile.emergencyContacts.length === 0 ? (
            <Text style={styles.caption}>{t("profileEdit.noEmergency")}</Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {profile.emergencyContacts.map((contact) => (
                <Card key={contact.id} style={styles.contact}>
                  <IconBadge icon="people-outline" tone="primary" size={44} rounded="circle" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.fullName}</Text>
                    <Text style={styles.caption}>
                      {contact.relationship} · {contact.phone}
                    </Text>
                  </View>
                  <Touchable onPress={() => Linking.openURL(`tel:${contact.phone.replace(/\s/g, "")}`)} accessibilityLabel={t("profileEdit.call", { name: contact.fullName })} style={[styles.round, { backgroundColor: colors.successSoft }]}>
                    <Ionicons name="call" size={18} color={colors.success} />
                  </Touchable>
                </Card>
              ))}
            </View>
          )}

          <SectionHeader title={t("profileEdit.bankTitle")} />
          <Text style={[styles.caption, { marginTop: -spacing.sm }]}>{t("profileEdit.bankHint")}</Text>
          <ReadonlyCard
            rows={[
              [t("profileEdit.bank"), profile.bankName],
              [t("profileEdit.accountNumber"), profile.accountNumber],
              [t("profileEdit.holder"), profile.accountHolder],
              [t("profileEdit.branch"), profile.bankBranch],
            ]}
          />
        </>
      )}

      {tab === "personal" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.fullName"), profile.fullName],
            [t("profileEdit.birthDate"), date(profile.dateOfBirth)],
            [t("profileEdit.birthPlace"), profile.placeOfBirth],
            [t("profileEdit.gender"), gender],
            [t("profileEdit.nationality"), profile.nationality],
            [t("profileEdit.ethnicity"), profile.ethnicity],
            [t("profileEdit.region"), profile.region],
          ]}
        />
      )}

      {tab === "identity" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.documentType"), profile.documentType ?? (profile.cccd ? t("profileEdit.citizenId") : null)],
            [t("profileEdit.documentNumber"), profile.cccd],
            [t("profileEdit.issuedAt"), date(profile.documentIssueDate)],
            [t("profileEdit.issuedBy"), profile.documentIssuedBy],
            [t("profileEdit.expiresAt"), date(profile.documentExpiryDate)],
          ]}
        />
      )}

      {tab === "study" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.studentCode"), profile.studentCode],
            [t("profileEdit.className"), profile.className],
            [t("profileEdit.university"), profile.university],
            [t("profileEdit.faculty"), profile.faculty],
            [t("profileEdit.major"), profile.major],
            [t("profileEdit.program"), profile.educationSystem],
            [t("profileEdit.cohort"), profile.course],
            [t("profileEdit.academicYear"), profile.currentAcademicYear],
          ]}
        />
      )}

      <Text style={styles.note}>{t("profileEdit.readonlyNote")}</Text>
    </>
  );
}

/** Tên đăng nhập và đổi mật khẩu. */
function AccountTab({ service }: { service: ReturnType<typeof useProfile>["service"] }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const { user } = useAuth();
  const [sheet, setSheet] = useState(false);
  const [passwords, setPasswords] = useState<PasswordDraft>(EMPTY_PASSWORDS);
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (passwords.next !== passwords.confirm) return notify(t("profileEdit.passwordMismatch"), "warning");
    if (passwords.next.length < 8 || passwords.next.length > 72 || !/\d/.test(passwords.next) || !/[a-zA-Z]/.test(passwords.next)) return notify(t("profileEdit.passwordWeak"), "warning");
    setSaving(true);
    try {
      await service.changePassword({ currentPassword: passwords.current, newPassword: passwords.next, confirmPassword: passwords.confirm });
      setSheet(false);
      setPasswords(EMPTY_PASSWORDS);
      notify(t("profileEdit.passwordChanged"));
    } catch (reason) {
      notify(errorMessage(reason), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ReadonlyCard rows={[[t("profileEdit.username"), user?.username ?? null]]} />
      <Card style={{ marginTop: spacing.lg, paddingVertical: spacing.xs }}>
        <ListRow icon="key-outline" tone="primary" title={t("profileEdit.changePassword")} onPress={() => setSheet(true)} />
      </Card>

      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={t("profileEdit.changePassword")}
        subtitle={t("profileEdit.passwordRule")}
        footer={<Button label={t("profileEdit.changePassword")} icon="checkmark" onPress={changePassword} loading={saving} disabled={!passwords.current || !passwords.next || !passwords.confirm} />}
      >
        <Field label={t("profileEdit.currentPassword")} icon="lock-closed-outline" secureTextEntry value={passwords.current} onChangeText={(current) => setPasswords((value) => ({ ...value, current }))} />
        <Field label={t("profileEdit.newPassword")} icon="key-outline" secureTextEntry value={passwords.next} onChangeText={(next) => setPasswords((value) => ({ ...value, next }))} />
        <Field label={t("profileEdit.confirmPassword")} icon="key-outline" secureTextEntry value={passwords.confirm} onChangeText={(confirm) => setPasswords((value) => ({ ...value, confirm }))} />
      </BottomSheet>
    </>
  );
}

function ReadonlyCard({ rows }: { rows: [string, string | null][] }) {
  return (
    <Card style={{ marginTop: spacing.xl, paddingVertical: spacing.xs }}>
      {rows.map(([label, value], index) => (
        <InfoRow key={label} label={label} value={value || "—"} divider={index < rows.length - 1} />
      ))}
    </Card>
  );
}

const useStyles = makeStyles(({ font }) => ({
  caption: { ...font.caption, fontSize: 13 },
  contact: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  contactName: { ...font.label, fontSize: 15 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  note: { ...font.caption, fontSize: 13, textAlign: "center", marginTop: spacing.lg, paddingHorizontal: spacing.lg },
}));
