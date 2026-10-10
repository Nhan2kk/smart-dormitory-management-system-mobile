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

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Chọn 1 ảnh từ thư viện; `"permission"` nếu bị từ chối quyền, `"too_large"` nếu quá 5MB, `null` nếu huỷ. */
export async function pickPhoto(): Promise<string | "permission" | "too_large" | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return "permission";
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return null;
  return asset.fileSize != null && asset.fileSize > MAX_PHOTO_BYTES ? "too_large" : asset.uri;
}
