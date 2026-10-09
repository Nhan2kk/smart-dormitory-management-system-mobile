import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiClient } from "../shared/api";
import type { ChatFeedbackRating } from "../enums/assistant.enum";
import type { ChatAnswerResponse, ChatBootstrapResponse, ChatConversation } from "../models/assistant.model";

/** Gọi API Trợ lý AI (RAG nội quy KTX) — không đổi hợp đồng backend. */
export class AssistantService {
  constructor(private readonly request: ApiClient) {}

  bootstrap(): Promise<ChatBootstrapResponse> {
    return this.request<ChatBootstrapResponse>("/chat-ai/bootstrap", { method: "GET" });
  }

  /** Gửi câu hỏi; truyền `conversationId` cũ để AI hiểu ngữ cảnh. */
  ask(question: string, conversationId?: string | null): Promise<ChatAnswerResponse> {
    return this.request<ChatAnswerResponse>("/chat-ai/messages", { body: { question, conversationId: conversationId || undefined } });
  }

  feedback(interactionId: string, rating: ChatFeedbackRating): Promise<void> {
    return this.request<void>(`/chat-ai/interactions/${encodeURIComponent(interactionId)}/feedback`, { body: { rating } });
  }
}

/** Giữ tối đa chừng này cuộc trò chuyện gần nhất trên máy. */
const MAX_CONVERSATIONS = 30;

/**
 * Lịch sử trò chuyện lưu trên máy theo từng tài khoản (backend không lưu lịch sử; web cũng lưu ở trình duyệt).
 */
export class ConversationStore {
  private readonly key: string;

  constructor(username: string) {
    this.key = `sdms.chat.${username}`;
  }

  async load(): Promise<ChatConversation[]> {
    try {
      const raw = await AsyncStorage.getItem(this.key);
      const parsed = raw ? (JSON.parse(raw) as ChatConversation[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async save(conversations: ChatConversation[]): Promise<void> {
    const latest = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_CONVERSATIONS);
    try {
      await AsyncStorage.setItem(this.key, JSON.stringify(latest));
    } catch {
      // Hết bộ nhớ hoặc lỗi ghi: vẫn dùng được trong phiên hiện tại.
    }
  }
}
