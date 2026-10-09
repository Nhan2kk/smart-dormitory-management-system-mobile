import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import type { ApiClient } from "./api";

export type Attachment = {
  id: string;
  name: string;
  size: string;
  kind: "image" | "document";
  url: string;
};

/** Ảnh minh chứng đã chọn: `uri` để xem trước, `id` sau khi upload thành công. */
export type EvidencePhoto = { uri: string; id?: string };

/** Upload 1 ảnh lên `POST /attachments` (multipart, field `file`). */
export async function uploadAttachment(
  request: ApiClient,
  uri: string,
): Promise<Attachment> {
  const name =
    uri.split("/").pop()?.split("?")[0] || `evidence-${Date.now()}.jpg`;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name.includes(".") ? name : `${name}.jpg`);
  } else {
    const type = /\.png$/i.test(name) ? "image/png" : "image/jpeg";
    form.append("file", { uri, name, type } as unknown as Blob);
  }
  return request<Attachment>("/attachments", { form });
}

/** Upload những ảnh chưa có `id`, trả về danh sách đã đủ `id`. */
export async function uploadPhotos(
  request: ApiClient,
  photos: EvidencePhoto[],
): Promise<Required<EvidencePhoto>[]> {
  const uploaded: Required<EvidencePhoto>[] = [];
  for (const photo of photos)
    uploaded.push({
      uri: photo.uri,
      id: photo.id ?? (await uploadAttachment(request, photo.uri)).id,
    });
  return uploaded;
}

/** Chọn 1 ảnh từ thư viện; `"permission"` nếu bị từ chối quyền, `null` nếu huỷ. */
export async function pickPhoto(): Promise<string | "permission" | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return "permission";
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  return picked.canceled || !picked.assets[0] ? null : picked.assets[0].uri;
}
