import * as ImagePicker from "expo-image-picker";

export type AvatarPickResult = { uri: string } | { error: "permission" | "tooLarge" } | null;

const MAX_BYTES = 2 * 1024 * 1024;

/** Chọn/chụp ảnh đại diện, cắt vuông, kiểm tra quyền và dung lượng (≤ 2MB như bên web). */
export class AvatarPicker {
  static async pick(source: "camera" | "library"): Promise<AvatarPickResult> {
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { error: "permission" };
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) return { error: "tooLarge" };
    return { uri: asset.uri };
  }
}
