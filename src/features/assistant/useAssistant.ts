import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "../../shared/api";
import { ChatFeedbackRating, ChatRole } from "../../enums/assistant.enum";
import type {
  ChatBootstrapResponse,
  ChatConversation,
  ChatConversationResponse,
  ChatHistoryMessageResponse,
  ChatMessage,
} from "../../models/assistant.model";
import { AssistantService } from "../../services/assistant.service";
import { useAuth } from "../auth/AuthProvider";

const TITLE_LENGTH = 60;

function fromSummary(summary: ChatConversationResponse): ChatConversation {
  return {
    id: summary.id,
    aiConversationId: summary.id,
    title: summary.title,
    updatedAt: summary.updatedAt ?? summary.createdAt ?? new Date().toISOString(),
    messages: [],
    messageCount: summary.messageCount,
    messagesLoaded: false,
  };
}

/** Mỗi lượt hỏi đáp đã lưu thành hai tin nhắn (câu hỏi, câu trả lời). */
function toMessages(history: ChatHistoryMessageResponse[]): ChatMessage[] {
  return history.flatMap((item, index) => {
    const key = item.interactionId ?? `h-${index}`;
    const feedback = item.feedbackRating === ChatFeedbackRating.Helpful || item.feedbackRating === ChatFeedbackRating.NotHelpful ? (item.feedbackRating as ChatFeedbackRating) : undefined;
    return [
      { id: `${key}-q`, role: ChatRole.User, text: item.question },
      { id: `${key}-a`, role: ChatRole.Assistant, text: item.answer, interactionId: item.interactionId, citations: item.citations, feedback },
    ];
  });
}

/**
 * Trò chuyện với Trợ lý AI: cấu hình (`/chat-ai/bootstrap`), hỏi đáp (`/chat-ai/messages`), đánh giá câu trả lời
 * và lịch sử lưu trên server (`/chat-ai/conversations`) — đồng bộ với web; tin nhắn chỉ tải khi mở cuộc trò chuyện.
 */
export function useAssistant(onError: (message: string) => void) {
  const { request } = useAuth();
  const service = useMemo(() => new AssistantService(request), [request]);
  const [bootstrap, setBootstrap] = useState<ChatBootstrapResponse | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const reportError = useRef(onError);
  const latest = useRef<ChatConversation[]>([]);

  useEffect(() => {
    reportError.current = onError;
  });

  const commit = useCallback((update: (current: ChatConversation[]) => ChatConversation[]) => {
    const next = update(latest.current);
    latest.current = next;
    setConversations(next);
  }, []);

  /** Tải lại danh sách từ server, giữ tin nhắn đã tải của các cuộc đang có. */
  const refreshHistory = useCallback(async () => {
    try {
      const history = await service.conversations();
      commit((current) =>
        history.map((summary) => {
          const known = current.find((item) => item.id === summary.id);
          return known?.messagesLoaded ? { ...known, title: summary.title, messageCount: summary.messageCount } : fromSummary(summary);
        }),
      );
    } catch (reason) {
      reportError.current(errorMessage(reason));
    }
  }, [commit, service]);

  useEffect(() => {
    let alive = true;
    service
      .bootstrap()
      .then((result) => alive && setBootstrap(result))
      .catch((reason: unknown) => alive && reportError.current(errorMessage(reason)));
    refreshHistory();
    return () => {
      alive = false;
    };
  }, [refreshHistory, service]);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  // Mở cuộc trò chuyện chưa tải tin nhắn → lấy từ server.
  const loadingId = active && !active.messagesLoaded ? active.id : null;

  useEffect(() => {
    if (!loadingId) return;
    let alive = true;
    service
      .messages(loadingId)
      .then((history) => {
        if (!alive) return;
        commit((current) => current.map((item) => (item.id === loadingId ? { ...item, messages: toMessages(history), messagesLoaded: true } : item)));
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        reportError.current(errorMessage(reason));
        // Đánh dấu đã thử để không kẹt trạng thái đang tải.
        commit((current) => current.map((item) => (item.id === loadingId ? { ...item, messagesLoaded: true } : item)));
      });
    return () => {
      alive = false;
    };
  }, [commit, loadingId, service]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || thinking) return;
      const now = new Date().toISOString();
      const conversationId = activeId ?? `local-${Date.now()}`;
      const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: ChatRole.User, text: question };
      const existing = latest.current.find((conversation) => conversation.id === conversationId);
      commit((current) =>
        existing
          ? [{ ...existing, updatedAt: now, messages: [...existing.messages, userMessage] }, ...current.filter((item) => item.id !== conversationId)]
          : [{ id: conversationId, aiConversationId: null, title: question.slice(0, TITLE_LENGTH), updatedAt: now, messages: [userMessage], messageCount: 0, messagesLoaded: true }, ...current],
      );
      setActiveId(conversationId);
      setThinking(true);
      try {
        const answer = await service.ask(question, existing?.aiConversationId);
        const reply: ChatMessage = { id: `a-${Date.now()}`, role: ChatRole.Assistant, text: answer.answer, interactionId: answer.interactionId, citations: answer.citations };
        // Cuộc mới: đổi mã tạm sang `conversationId` của server để web và mobile cùng một mã.
        const serverId = answer.conversationId || conversationId;
        commit((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, id: serverId, aiConversationId: answer.conversationId, updatedAt: new Date().toISOString(), messages: [...conversation.messages, reply], messageCount: conversation.messageCount + 1 }
              : conversation,
          ),
        );
        setActiveId((current) => (current === conversationId ? serverId : current));
      } catch (reason) {
        reportError.current(errorMessage(reason));
      } finally {
        setThinking(false);
      }
    },
    [activeId, commit, service, thinking],
  );

  const rate = useCallback(
    async (message: ChatMessage, helpful: boolean) => {
      if (!message.interactionId || !activeId) return false;
      const rating = helpful ? ChatFeedbackRating.Helpful : ChatFeedbackRating.NotHelpful;
      try {
        await service.feedback(message.interactionId, rating);
        commit((current) =>
          current.map((conversation) =>
            conversation.id === activeId ? { ...conversation, messages: conversation.messages.map((item) => (item.id === message.id ? { ...item, feedback: rating } : item)) } : conversation,
          ),
        );
        return true;
      } catch (reason) {
        reportError.current(errorMessage(reason));
        return false;
      }
    },
    [activeId, commit, service],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = latest.current.find((conversation) => conversation.id === id);
      try {
        // Cuộc mới chưa có câu trả lời thì chưa có trên server: chỉ gỡ khỏi danh sách.
        if (target?.aiConversationId) await service.delete(target.aiConversationId);
        commit((current) => current.filter((conversation) => conversation.id !== id));
        if (id === activeId) setActiveId(null);
        return true;
      } catch (reason) {
        reportError.current(errorMessage(reason));
        return false;
      }
    },
    [activeId, commit, service],
  );

  return {
    bootstrap,
    conversations,
    messages,
    thinking,
    loadingMessages: loadingId !== null,
    send,
    rate,
    remove,
    refreshHistory,
    open: setActiveId,
    newChat: () => setActiveId(null),
  };
}
