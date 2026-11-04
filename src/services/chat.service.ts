import type { ApiClient } from "../shared/api";
import type {
  ChatConversation,
  ChatInfo,
  ChatMessage,
  ChatMessagePage,
  ChatSendRequest,
} from "../models/chat.model";
export class ChatService {
  constructor(private readonly request: ApiClient) {}
  conversation() {
    return this.request<ChatConversation>("/student/chat/conversation");
  }
  info() {
    return this.request<ChatInfo>("/student/chat/info");
  }
  messages(before?: string, beforeId?: string) {
    return this.request<ChatMessagePage>("/student/chat/messages/search", {
      body: { before, beforeId, size: 30 },
    });
  }
  send(body: ChatSendRequest) {
    return this.request<ChatMessage>("/student/chat/messages/send", { body });
  }
  read() {
    return this.request<{ unreadCount: number }>("/student/chat/read");
  }
  unread() {
    return this.request<{ unreadCount: number }>("/student/chat/unread-count");
  }
  rate(rating: number, comment: string) {
    return this.request<ChatConversation>("/student/chat/rate", {
      body: { rating, comment },
    });
  }
}
