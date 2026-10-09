import type { ApiClient } from "../shared/api";
import type { ChatFeedbackRating } from "../enums/assistant.enum";
import type {
  ChatAnswerResponse,
  ChatBootstrapResponse,
  ChatConversationResponse,
  ChatHistoryMessageResponse,
} from "../models/assistant.model";

/** Gọi API Trợ lý AI; lịch sử trò chuyện lưu trên server nên đồng bộ giữa web và mobile. */
export class AssistantService {
  constructor(private readonly request: ApiClient) {}

  bootstrap(): Promise<ChatBootstrapResponse> {
    return this.request<ChatBootstrapResponse>("/chat-ai/bootstrap", {
      method: "GET",
    });
  }

  /** Gửi câu hỏi; truyền `conversationId` cũ để AI hiểu ngữ cảnh. */
  ask(
    question: string,
    conversationId?: string | null,
  ): Promise<ChatAnswerResponse> {
    return this.request<ChatAnswerResponse>("/chat-ai/messages", {
      body: { question, conversationId: conversationId || undefined },
    });
  }

  feedback(interactionId: string, rating: ChatFeedbackRating): Promise<void> {
    return this.request<void>(
      `/chat-ai/interactions/${encodeURIComponent(interactionId)}/feedback`,
      { body: { rating } },
    );
  }

  /** Danh sách cuộc trò chuyện của người đang đăng nhập, mới cập nhật trước. */
  conversations(): Promise<ChatConversationResponse[]> {
    return this.request<ChatConversationResponse[]>("/chat-ai/conversations");
  }

  /** Các lượt hỏi đáp trong một cuộc trò chuyện, cũ trước. */
  messages(conversationId: string): Promise<ChatHistoryMessageResponse[]> {
    return this.request<ChatHistoryMessageResponse[]>(
      "/chat-ai/conversations/messages",
      { body: { conversationId } },
    );
  }

  delete(conversationId: string): Promise<void> {
    return this.request<void>("/chat-ai/conversations/delete", {
      body: { conversationId },
    });
  }
}
