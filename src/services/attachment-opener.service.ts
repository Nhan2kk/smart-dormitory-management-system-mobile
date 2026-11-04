import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";
import type { ChatAttachment } from "../models/chat.model";

/**
 * Opens a chat attachment with the phone's own viewer.
 *
 * Cloudinary serves non-image ("raw") uploads as a nameless `application/octet-stream`
 * download, and this Cloudinary account blocks PDF delivery once the URL carries a `.pdf`
 * extension. So the URL alone cannot be viewed: the file is downloaded into the app cache
 * under its original name (with extension) and handed to the system viewer / share sheet.
 */
export class AttachmentOpener {
  static async open(file: ChatAttachment): Promise<void> {
    if (Platform.OS === "web" || file.contentType.startsWith("image/")) {
      await Linking.openURL(file.url);
      return;
    }
    if (!(await Sharing.isAvailableAsync())) {
      await Linking.openURL(file.url);
      return;
    }
    const local = await AttachmentOpener.download(file);
    await Sharing.shareAsync(local.uri, {
      mimeType: file.contentType,
      dialogTitle: file.fileName,
    });
  }

  /** Cached per attachment id, so opening the same file again does not re-download it. */
  private static async download(file: ChatAttachment): Promise<File> {
    const folder = new Directory(Paths.cache, "chat-attachments", file.id);
    folder.create({ intermediates: true, idempotent: true });
    const target = new File(folder, AttachmentOpener.safeName(file.fileName));
    if (target.exists) return target;
    return File.downloadFileAsync(file.url, target, { idempotent: true });
  }

  private static safeName(name: string): string {
    const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
    return clean || "file";
  }
}
