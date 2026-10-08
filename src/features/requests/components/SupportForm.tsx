import { useState } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Field, FormSection, OptionGrid, PhotoSlots, SegmentedControl } from "../../../shared/ui";
import { RequestFormShell } from "./RequestFormShell";

type IssueType = "electrical" | "plumbing" | "internet" | "appliance";
type Location = "room" | "commonArea";
type Priority = "low" | "medium" | "high";

export function SupportForm() {
  const { t } = useI18n();
  const [issue, setIssue] = useState<IssueType | null>(null);
  const [location, setLocation] = useState<Location>("room");
  const [priority, setPriority] = useState<Priority>("medium");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState(0);

  return (
    <RequestFormShell
      kind="supportMaintenance"
      validate={() => (!issue ? t("requestForm.errIssue") : description.trim().length < 10 ? t("requestForm.errDescription") : null)}
      summary={[
        { label: t("requestForm.issueType"), value: issue ? t(`requestForm.issue.${issue}`) : "—" },
        { label: t("requestForm.location"), value: location === "room" ? "A101" : t("requestForm.commonArea") },
        { label: t("requestForm.priority"), value: t(`requestForm.${priority}`) },
        { label: t("requestForm.description"), value: description.trim() },
        { label: t("requestForm.images"), value: t("common.photos", { count: photos }) },
      ]}
    >
      <FormSection title={t("requestForm.issueType")}>
        <OptionGrid<IssueType>
          value={issue}
          onChange={setIssue}
          options={[
            { value: "electrical", label: t("requestForm.issue.electrical"), icon: "flash-outline", description: t("requestForm.issueHint.electrical") },
            { value: "plumbing", label: t("requestForm.issue.plumbing"), icon: "water-outline", description: t("requestForm.issueHint.plumbing") },
            { value: "internet", label: t("requestForm.issue.internet"), icon: "wifi-outline", description: t("requestForm.issueHint.internet") },
            { value: "appliance", label: t("requestForm.issue.appliance"), icon: "hammer-outline", description: t("requestForm.issueHint.appliance") },
          ]}
        />
      </FormSection>

      <FormSection title={t("requestForm.location")}>
        <SegmentedControl<Location>
          value={location}
          onChange={setLocation}
          options={[
            { value: "room", label: t("requestForm.myRoom") },
            { value: "commonArea", label: t("requestForm.commonArea") },
          ]}
        />
      </FormSection>

      <FormSection title={t("requestForm.priority")} hint={t("requestForm.priorityHint")}>
        <SegmentedControl<Priority>
          value={priority}
          onChange={setPriority}
          options={[
            { value: "low", label: t("requestForm.low") },
            { value: "medium", label: t("requestForm.medium") },
            { value: "high", label: t("requestForm.high") },
          ]}
        />
      </FormSection>

      <FormSection title={t("requestForm.description")}>
        <Field
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder={t("requestForm.descriptionPlaceholder")}
          maxLength={500}
          hint={t("requestForm.characters", { count: description.length })}
        />
      </FormSection>

      <FormSection title={t("requestForm.evidence")} hint={t("requestForm.evidenceHint")}>
        <PhotoSlots count={photos} onAdd={() => setPhotos((value) => value + 1)} onRemove={() => setPhotos((value) => value - 1)} />
      </FormSection>
    </RequestFormShell>
  );
}
