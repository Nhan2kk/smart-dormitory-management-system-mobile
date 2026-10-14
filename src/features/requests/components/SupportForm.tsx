import { useEffect, useMemo, useState } from "react";
import { EvidencePhoto, pickPhotos, uploadPhotos } from "../../../shared/attachments";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Field, FormSection, OptionGrid, PhotoSlots, SegmentedControl, useToast } from "../../../shared/ui";
import { useAuth } from "../../auth/AuthProvider";
import { IssueLocation, Priority, SupportIssueType } from "../../../enums/request.enum";
import { RequestService } from "../../../services/request.service";
import { RequestFormShell } from "./RequestFormShell";

export function SupportForm() {
  const { t } = useI18n();
  const { notify } = useToast();
  const { request } = useAuth();
  const api = useMemo(() => new RequestService(request), [request]);
  const [issue, setIssue] = useState<SupportIssueType | null>(null);
  const [location, setLocation] = useState<IssueLocation>("room");
  const [priority, setPriority] = useState<Priority>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Phòng hiện tại chỉ để hiển thị; BE tự gắn phòng từ hồ sơ lưu trú khi gửi.
  useEffect(() => {
    api
      .residency()
      .then((residency) => setRoomCode(residency.roomCode))
      .catch(() => undefined);
  }, [api]);

  const addPhoto = async () => {
    const uris = await pickPhotos(10 - photos.length);
    if (uris === "permission") return notify(t("checkIn.photoPermission"), "warning");
    if (uris === "too_large") return notify(t("checkIn.photoTooLarge"), "warning");
    if (uris) setPhotos((current) => [...current, ...uris.map(uri => ({ uri }))].slice(0, 10));
  };

  const submit = async () => {
    const attachmentIds = (await uploadPhotos(request, photos)).map((photo) => photo.id);
    const created = await api.createSupport({ issueType: issue!, issueLocation: location, priority, title: title.trim(), description: description.trim(), attachmentIds });
    return created.id;
  };

  return (
    <RequestFormShell
      kind="supportMaintenance"
      validate={() => (!issue ? t("requestForm.errIssue") : !title.trim() ? t("requestForm.errTitle") : description.trim().length < 10 ? t("requestForm.errDescription") : null)}
      onSubmit={submit}
      summary={[
        { label: t("requestForm.issueType"), value: issue ? t(`requestForm.issue.${issue}`) : "—" },
        { label: t("requestForm.location"), value: location === "room" ? roomCode ?? t("requestForm.myRoom") : t("requestForm.commonArea") },
        { label: t("requestForm.priority"), value: t(`requestForm.${priority}`) },
        { label: t("requestForm.title"), value: title.trim() },
        { label: t("requestForm.description"), value: description.trim() },
        { label: t("requestForm.images"), value: t("common.photos", { count: photos.length }) },
      ]}
    >
      <FormSection title={t("requestForm.issueType")}>
        <OptionGrid<SupportIssueType>
          value={issue}
          onChange={setIssue}
          options={[
            { value: "electrical", label: t("requestForm.issue.electrical"), icon: "flash-outline", description: t("requestForm.issueHint.electrical") },
            { value: "plumbing", label: t("requestForm.issue.plumbing"), icon: "water-outline", description: t("requestForm.issueHint.plumbing") },
            { value: "internet", label: t("requestForm.issue.internet"), icon: "wifi-outline", description: t("requestForm.issueHint.internet") },
            { value: "doorLock", label: t("requestForm.issue.doorLock"), icon: "key-outline", description: t("requestForm.issueHint.doorLock") },
            { value: "appliance", label: t("requestForm.issue.appliance"), icon: "hammer-outline", description: t("requestForm.issueHint.appliance") },
            { value: "other", label: t("requestForm.issue.other"), icon: "ellipsis-horizontal-circle-outline", description: t("requestForm.issueHint.other") },
          ]}
        />
      </FormSection>

      <FormSection title={t("requestForm.location")}>
        <SegmentedControl<IssueLocation>
          value={location}
          onChange={setLocation}
          options={[
            { value: "room", label: roomCode ? `${t("requestForm.myRoom")} · ${roomCode}` : t("requestForm.myRoom") },
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

      <FormSection title={t("requestForm.title")}>
        <Field value={title} onChangeText={setTitle} placeholder={t("requestForm.titlePlaceholder")} maxLength={150} />
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
        <PhotoSlots count={photos.length} uris={photos.map((photo) => photo.uri)} onAdd={addPhoto} onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))} />
      </FormSection>
    </RequestFormShell>
  );
}
