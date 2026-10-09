import type { ChatFeedbackRating, ChatRole } from "../enums/assistant.enum";

export interface ChatQuickQuestionResponse {
  id: string;
  textKey: string;
}

export interface ChatBootstrapResponse {
  enabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  language: "vi" | "en";
  quickQuestions: ChatQuickQuestionResponse[];
}

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

export interface ChatFeedbackRequest {
  rating: ChatFeedbackRating;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  interactionId?: string | null;
  citations?: ChatCitationResponse[];
  feedback?: ChatFeedbackRating;
}

export interface ChatConversation {
  id: string;
  aiConversationId: string | null;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}
