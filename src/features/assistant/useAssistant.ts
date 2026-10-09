import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "../../shared/api";
import { ChatFeedbackRating, ChatRole } from "../../enums/assistant.enum";
import type { ChatBootstrapResponse, ChatConversation, ChatMessage } from "../../models/assistant.model";
import { AssistantService, ConversationStore } from "../../services/assistant.service";
import { useAuth } from "../auth/AuthProvider";

const TITLE_LENGTH = 60;

/**
 * Trò chuyện với Trợ lý AI: cấu hình (`/chat-ai/bootstrap`), hỏi đáp (`/chat-ai/messages`),
 * đánh giá câu trả lời và lịch sử trò chuyện lưu trên máy.
 */
export function useAssistant(onError: (message: string) => void) {
  const { request, user } = useAuth();
  const service = useMemo(() => new AssistantService(request), [request]);
  const store = useMemo(() => new ConversationStore(user?.username ?? "guest"), [user?.username]);
  const [bootstrap, setBootstrap] = useState<ChatBootstrapResponse | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const reportError = useRef(onError);
  const latest = useRef<ChatConversation[]>([]);

  useEffect(() => {
    reportError.current = onError;
  });

  useEffect(() => {
    let active = true;
    service
      .bootstrap()
      .then((result) => active && setBootstrap(result))
      .catch((reason: unknown) => active && reportError.current(errorMessage(reason)));
    store.load().then((saved) => {
      if (!active) return;
      latest.current = saved;
      setConversations(saved);
    });
    return () => {
      active = false;
    };
  }, [service, store]);

  /** Cập nhật danh sách và lưu xuống máy. */
  const commit = useCallback(
    (update: (current: ChatConversation[]) => ChatConversation[]) => {
      const next = update(latest.current);
      latest.current = next;
      setConversations(next);
      void store.save(next);
    },
    [store],
  );

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || thinking) return;
      const now = new Date().toISOString();
      const conversationId = activeId ?? `c-${Date.now()}`;
      const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: ChatRole.User, text: question };
      const existing = latest.current.find((conversation) => conversation.id === conversationId);
      commit((current) =>
        existing
          ? current.map((conversation) => (conversation.id === conversationId ? { ...conversation, updatedAt: now, messages: [...conversation.messages, userMessage] } : conversation))
          : [{ id: conversationId, aiConversationId: null, title: question.slice(0, TITLE_LENGTH), updatedAt: now, messages: [userMessage] }, ...current],
      );
      setActiveId(conversationId);
      setThinking(true);
      try {
        const answer = await service.ask(question, existing?.aiConversationId);
        const reply: ChatMessage = {
          id: `a-${Date.now()}`,
          role: ChatRole.Assistant,
          text: answer.answer,
          interactionId: answer.interactionId,
          citations: answer.citations,
        };
        commit((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, aiConversationId: answer.conversationId, updatedAt: new Date().toISOString(), messages: [...conversation.messages, reply] }
              : conversation,
          ),
        );
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
    (id: string) => {
      commit((current) => current.filter((conversation) => conversation.id !== id));
      if (id === activeId) setActiveId(null);
    },
    [activeId, commit],
  );

  return { bootstrap, conversations, messages, thinking, send, rate, remove, open: setActiveId, newChat: () => setActiveId(null) };
}
