import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Card, ChipGroup, Field, FooterBar, IconBadge, InfoRow, ListRow, Screen, SectionHeader, Touchable, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { EmergencyContact, ProfileRepository } from "./profile.mock";

type Tab = "contact" | "personal" | "identity" | "study" | "account";

export function ProfileEditScreen() {
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useStyles();
  const profile = ProfileRepository.get();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? "contact");
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.permanentAddress);
  const [bank, setBank] = useState(profile.bank);
  const [contacts, setContacts] = useState<EmergencyContact[]>(profile.emergencyContacts);
  const [contactSheet, setContactSheet] = useState(false);
  const [draft, setDraft] = useState({ fullName: "", relationship: "", phone: "" });
  const [passwordSheet, setPasswordSheet] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const emailError = email && !/^\S+@\S+\.\S+$/.test(email) ? t("profileEdit.emailInvalid") : undefined;
  const dirty =
    phone !== profile.phone ||
    email !== profile.email ||
    address !== profile.permanentAddress ||
    JSON.stringify(bank) !== JSON.stringify(profile.bank) ||
    contacts.length !== profile.emergencyContacts.length;

  const save = () => {
    if (emailError) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      notify(t("profileEdit.saved"));
      router.back();
    }, 600);
  };

  const addContact = () => {
    if (!draft.fullName.trim() || !draft.relationship.trim() || !draft.phone.trim()) return notify(t("profileEdit.contactRequired"), "warning");
    setContacts((current) => [...current, { id: `ec-${Date.now()}`, ...draft }]);
    setDraft({ fullName: "", relationship: "", phone: "" });
    setContactSheet(false);
    notify(t("profileEdit.contactAdded"));
  };

  const changePassword = () => {
    if (passwords.next !== passwords.confirm) return notify(t("profileEdit.passwordMismatch"), "warning");
    if (passwords.next.length < 8 || !/\d/.test(passwords.next) || !/[a-zA-Z]/.test(passwords.next)) return notify(t("profileEdit.passwordWeak"), "warning");
    setPasswordSheet(false);
    setPasswords({ current: "", next: "", confirm: "" });
    notify(t("profileEdit.passwordChanged"));
  };

  return (
    <Screen
      header={<AppHeader title={t("profileEdit.title")} />}
      footer={
        tab === "contact" ? (
          <FooterBar>
            <Button label={t("common.saveChanges")} icon="checkmark" onPress={save} loading={saving} disabled={!dirty || !!emailError} style={{ flex: 1 }} />
          </FooterBar>
        ) : undefined
      }
    >
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

      {tab === "contact" && (
        <>
          <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
            <Field label={t("profileEdit.phone")} icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label={t("profileEdit.email")} icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={emailError} />
            <Field label={t("profileEdit.permanentAddress")} icon="home-outline" value={address} onChangeText={setAddress} multiline />
          </View>

          <SectionHeader title={t("profileEdit.emergency")} action={t("common.add")} onAction={() => setContactSheet(true)} />
          <View style={{ gap: spacing.md }}>
            {contacts.map((contact) => (
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
                <Touchable
                  onPress={() => {
                    setContacts((current) => current.filter((item) => item.id !== contact.id));
                    notify(t("profileEdit.contactRemoved"));
                  }}
                  accessibilityLabel={t("profileEdit.removeContact", { name: contact.fullName })}
                  style={[styles.round, { backgroundColor: colors.dangerSoft }]}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                </Touchable>
              </Card>
            ))}
          </View>

          <SectionHeader title={t("profileEdit.bankTitle")} />
          <Text style={[styles.caption, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>{t("profileEdit.bankHint")}</Text>
          <View style={{ gap: spacing.lg }}>
            <Field label={t("profileEdit.bank")} icon="business-outline" value={bank.name} onChangeText={(name) => setBank((current) => ({ ...current, name }))} />
            <Field label={t("profileEdit.accountNumber")} icon="card-outline" value={bank.accountNumber} keyboardType="number-pad" onChangeText={(accountNumber) => setBank((current) => ({ ...current, accountNumber }))} />
            <Field label={t("profileEdit.holder")} icon="person-circle-outline" value={bank.holder} autoCapitalize="characters" onChangeText={(holder) => setBank((current) => ({ ...current, holder }))} />
            <Field label={t("profileEdit.branch")} icon="location-outline" value={bank.branch} onChangeText={(branch) => setBank((current) => ({ ...current, branch }))} />
          </View>
        </>
      )}

      {tab === "personal" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.fullName"), profile.fullName],
            [t("profileEdit.birthDate"), Formatter.date(profile.birthDate)],
            [t("profileEdit.birthPlace"), l(profile.birthPlace)],
            [t("profileEdit.gender"), t(`common.${profile.gender}`)],
            [t("profileEdit.nationality"), l(profile.nationality)],
            [t("profileEdit.ethnicity"), l(profile.ethnicity)],
            [t("profileEdit.hometown"), l(profile.hometown)],
            [t("profileEdit.currentAddress"), l(profile.currentAddress)],
          ]}
        />
      )}

      {tab === "identity" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.documentType"), t("profileEdit.citizenId")],
            [t("profileEdit.documentNumber"), profile.identity.number],
            [t("profileEdit.issuedAt"), Formatter.date(profile.identity.issuedAt)],
            [t("profileEdit.issuedBy"), l(profile.identity.issuedBy)],
            [t("profileEdit.expiresAt"), Formatter.date(profile.identity.expiresAt)],
          ]}
        />
      )}

      {tab === "study" && (
        <ReadonlyCard
          rows={[
            [t("profileEdit.studentCode"), user?.username || profile.studentCode],
            [t("profileEdit.className"), profile.className],
            [t("profileEdit.university"), l(profile.university)],
            [t("profileEdit.faculty"), l(profile.faculty)],
            [t("profileEdit.major"), l(profile.major)],
            [t("profileEdit.program"), l(profile.program)],
            [t("profileEdit.cohort"), profile.cohort],
            [t("profileEdit.academicYear"), profile.academicYear],
          ]}
        />
      )}

      {tab === "account" && (
        <>
          <ReadonlyCard
            rows={[
              [t("profileEdit.username"), profile.account.username],
              [t("profileEdit.lastPasswordChange"), Formatter.dateTime(profile.account.lastPasswordChange)],
            ]}
          />
          <Card style={{ marginTop: spacing.lg, paddingVertical: spacing.xs }}>
            <ListRow icon="key-outline" tone="primary" title={t("profileEdit.changePassword")} onPress={() => setPasswordSheet(true)} />
          </Card>
        </>
      )}

      {tab !== "contact" && tab !== "account" && <Text style={styles.note}>{t("profileEdit.readonlyNote")}</Text>}

      <BottomSheet visible={contactSheet} onClose={() => setContactSheet(false)} title={t("profileEdit.addContact")} footer={<Button label={t("common.add")} icon="person-add-outline" onPress={addContact} />}>
        <Field label={t("profileEdit.contactName")} icon="person-outline" value={draft.fullName} onChangeText={(fullName) => setDraft((current) => ({ ...current, fullName }))} />
        <Field label={t("profileEdit.relationship")} icon="heart-outline" value={draft.relationship} onChangeText={(relationship) => setDraft((current) => ({ ...current, relationship }))} />
        <Field label={t("profileEdit.phone")} icon="call-outline" value={draft.phone} keyboardType="phone-pad" onChangeText={(value) => setDraft((current) => ({ ...current, phone: value }))} />
      </BottomSheet>

      <BottomSheet visible={passwordSheet} onClose={() => setPasswordSheet(false)} title={t("profileEdit.changePassword")} subtitle={t("profileEdit.passwordRule")} footer={<Button label={t("profileEdit.changePassword")} icon="checkmark" onPress={changePassword} disabled={!passwords.current || !passwords.next} />}>
        <Field label={t("profileEdit.currentPassword")} icon="lock-closed-outline" secureTextEntry value={passwords.current} onChangeText={(current) => setPasswords((value) => ({ ...value, current }))} />
        <Field label={t("profileEdit.newPassword")} icon="key-outline" secureTextEntry value={passwords.next} onChangeText={(next) => setPasswords((value) => ({ ...value, next }))} />
        <Field label={t("profileEdit.confirmPassword")} icon="key-outline" secureTextEntry value={passwords.confirm} onChangeText={(confirm) => setPasswords((value) => ({ ...value, confirm }))} />
      </BottomSheet>
    </Screen>
  );
}

function ReadonlyCard({ rows }: { rows: [string, string][] }) {
  return (
    <Card style={{ marginTop: spacing.xl, paddingVertical: spacing.xs }}>
      {rows.map(([label, value], index) => (
        <InfoRow key={label} label={label} value={value} divider={index < rows.length - 1} />
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
