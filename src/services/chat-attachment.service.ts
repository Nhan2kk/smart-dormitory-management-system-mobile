import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import type { ChatUpload } from "../models/chat.model";
import type { ApiClient } from "../shared/api";

const MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export class ChatAttachmentService {
  static valid(files: ChatUpload[]) {
    return (
      files.length <= 5 &&
      files.every(
        (f) =>
          MIME.includes(f.contentType) &&
          f.size > 0 &&
          f.size <= (f.contentType.startsWith("image/") ? 5 : 10) * 1024 * 1024,
      )
    );
  }
  static async photos(
    camera = false,
    limit = 5,
  ): Promise<ChatUpload[] | "permission"> {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return "permission";
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({
          ...options,
          allowsMultipleSelection: true,
          selectionLimit: limit,
        });
    if (result.canceled) return [];
    return Promise.all(
      result.assets.map(async (a) => ({
        uri: a.uri,
        name: a.fileName ?? a.uri.split("/").pop() ?? "photo.jpg",
        contentType: a.mimeType ?? "image/jpeg",
        size: a.fileSize ?? (await ChatAttachmentService.size(a.uri)),
      })),
    );
  }
  static async documents(): Promise<ChatUpload[]> {
    const result = await DocumentPicker.getDocumentAsync({
      type: MIME.slice(3),
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return [];
    return Promise.all(
      result.assets.map(async (a) => ({
        uri: a.uri,
        name: a.name,
        contentType:
          a.mimeType ??
          (a.name.toLowerCase().endsWith(".pdf") ? MIME[3] : MIME[4]),
        size: a.size ?? (await ChatAttachmentService.size(a.uri)),
      })),
    );
  }
  private static async size(uri: string): Promise<number> {
    return Platform.OS === "web"
      ? (await (await fetch(uri)).blob()).size
      : new File(uri).size;
  }
  static async upload(request: ApiClient, item: ChatUpload): Promise<string> {
    if (item.id) return item.id;
    const form = new FormData();
    if (Platform.OS === "web")
      form.append("file", await (await fetch(item.uri)).blob(), item.name);
    else {
      const file = new File(item.uri);
      form.append("file", {
        name: item.name,
        type: item.contentType,
        bytes: () => file.bytes(),
      } as unknown as Blob);
    }
    return (await request<{ id: string }>("/attachments", { form })).id;
  }
}
