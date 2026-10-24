import { File } from "expo-file-system";
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

/** Thêm ảnh tại `uri` vào form. Trên native, `fetch` của Expo (SDK 57) không nhận part dạng
 * `{ uri, name, type }` của React Native mà cần đối tượng có `bytes()`, nên đọc file qua expo-file-system. */
async function appendPhoto(form: FormData, field: string, uri: string) {
  const raw = uri.split("/").pop()?.split("?")[0] || `evidence-${Date.now()}`;
  const name = raw.includes(".") ? raw : `${raw}.jpg`;
  if (Platform.OS === "web") {
    form.append(field, await (await fetch(uri)).blob(), name);
    return;
  }
  const type = /\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : "image/jpeg";
  const file = new File(uri);
  form.append(field, { name, type, bytes: () => file.bytes() } as unknown as Blob);
}

/** Upload 1 ảnh lên `POST /attachments` (multipart, field `file`). */
export async function uploadAttachment(
  request: ApiClient,
  uri: string,
): Promise<Attachment> {
  const form = new FormData();
  await appendPhoto(form, "file", uri);
  return request<Attachment>("/attachments", { form });
}

/** Upload những ảnh chưa có `id`, trả về danh sách đã đủ `id`. */
export async function uploadPhotos(
  request: ApiClient,
  photos: EvidencePhoto[],
): Promise<Required<EvidencePhoto>[]> {
  const pending = photos.filter(photo => !photo.id);
  if (!pending.length) return photos as Required<EvidencePhoto>[];
  if (pending.length > 10) throw new Error("Mỗi lần tối đa 10 ảnh");
  const form = new FormData();
  for (const photo of pending) await appendPhoto(form, "files", photo.uri);
  const records = await request<Attachment[]>("/attachments/batch", { form });
  if (records.length !== pending.length) throw new Error("Số ảnh tải lên không khớp");
  let index = 0;
  return photos.map(photo => ({ uri: photo.uri, id: photo.id ?? records[index++].id }));
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

/** SDK 57 multi-selection with picker compression; validate the compressed asset sizes. */
export async function pickPhotos(limit = 10): Promise<string[] | "permission" | "too_large" | null> {
  if (limit <= 0) return null;
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return "permission";
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"], quality: 0.7, allowsMultipleSelection: true,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    orderedSelection: true,
    selectionLimit: Math.min(10, limit),
  });
  if (picked.canceled) return null;
  const assets = picked.assets.slice(0, limit);
  if (assets.some(asset => asset.fileSize != null && asset.fileSize > MAX_PHOTO_BYTES)) return "too_large";
  return assets.map(asset => asset.uri);
}
