import type { ChatFeedbackRating, ChatRole } from "../enums/assistant.enum";

// ---- Dữ liệu server trả về / nhận ----

export interface ChatQuickQuestionResponse {
  id: string;
  /** Khoá bản dịch (vd. `chatAi.questions.curfew`) hoặc câu hỏi BQL tự nhập. */
  textKey: string;
}

/** `GET /chat-ai/bootstrap` — cấu hình Trợ lý AI cho người dùng. */
export interface ChatBootstrapResponse {
  enabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  language: "vi" | "en";
  quickQuestions: ChatQuickQuestionResponse[];
}

/** Đoạn tài liệu (nội quy, quy định) AI dùng để trả lời. */
export interface ChatCitationResponse {
  sourceId: string;
  documentId: string;
  documentVersion: number;
  filename: string;
  excerpt: string;
  score: number;
  pageNumber: number | null;
  section: string | null;
}

/** `POST /chat-ai/messages`. */
export interface ChatAskRequest {
  question: string;
  conversationId?: string;
}

export interface ChatAnswerResponse {
  interactionId: string | null;
  conversationId: string;
  answer: string;
  citations: ChatCitationResponse[];
  grounded: boolean;
  outOfScopeAnswer: boolean;
}

/** `POST /chat-ai/interactions/{id}/feedback`. */
export interface ChatFeedbackRequest {
  rating: ChatFeedbackRating;
}

// ---- Dữ liệu cho màn hình (lưu trên máy) ----

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Mã lượt hỏi đáp để gửi đánh giá; null với câu trả lời dự phòng. */
  interactionId?: string | null;
  citations?: ChatCitationResponse[];
  feedback?: ChatFeedbackRating;
}

export interface ChatConversation {
  id: string;
  /** `conversationId` backend trả về để AI nhớ ngữ cảnh các câu hỏi tiếp theo. */
  aiConversationId: string | null;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}
