import type {
  ChatConversationStatus,
  ChatMessageType,
  ChatRealtimeEventType,
  ChatSenderRole,
} from "../enums/chat.enum";
export interface ChatAttachment {
  id: string;
  url: string;
  publicId: string;
  fileName: string;
  contentType: string;
  size: number;
}
export interface ChatConversation {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  roomCode: string | null;
  buildingName: string | null;
  assignedEmployeeName: string | null;
  status: ChatConversationStatus;
  unreadByStudent: number;
  studentLastReadAt: string | null;
  staffLastReadAt: string | null;
  rating: number | null;
  ratingComment: string | null;
}
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  senderName: string;
  type: ChatMessageType;
  linkedRequestId: string | null;
  content: string;
  attachments: ChatAttachment[];
  clientMessageId: string;
  createdAt: string;
  delivery?: "sending" | "failed";
}
export interface ChatRealtimeEvent {
  event: ChatRealtimeEventType;
  conversationId: string;
  conversation: ChatConversation;
  message: ChatMessage | null;
}
export interface ChatMessagePage {
  items: ChatMessage[];
  hasMore: boolean;
}
export interface ChatInfo {
  greeting: string;
  emergencyHotline: string;
  emergencyNote: string;
  isWorkingHours: boolean;
  nextOpenAt: string;
  timezone: string;
  workingHours: { dayOfWeek: number; start: string; end: string }[];
}
export interface ChatSendRequest {
  clientMessageId: string;
  content: string;
  attachmentIds: string[];
}
export interface ChatUpload {
  uri: string;
  name: string;
  contentType: string;
  size: number;
  id?: string;
}
