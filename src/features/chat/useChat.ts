import { randomUUID } from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import type {
  ChatConversation,
  ChatMessage,
  ChatSendRequest,
  ChatUpload,
} from "../../models/chat.model";
import { ChatService } from "../../services/chat.service";
import { ChatAttachmentService } from "../../services/chat-attachment.service";
import { errorMessage } from "../../shared/api";
import { useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { useSupportChatState } from "./SupportChatProvider";
import { mergeChatMessages } from "./chat-state";

export function useChat() {
  const { request, user } = useAuth();
  const { notify } = useToast();
  const { allowed, reload: reloadBadge } = useSupportChatState();
  const { lastChat, connected, reconnectSignal } = useRealtime();
  const service = useMemo(() => new ChatService(request), [request]);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const focused = useRef(false);
  const loadingMore = useRef(false);
  const pending = useRef(new Map<string, ChatSendRequest>());
  const refresh = useCallback(async () => {
    if (!allowed || !focused.current) return;
    const [c, page] = await Promise.all([
      service.conversation(),
      service.messages(),
    ]);
    if (!focused.current) return;
    setConversation(c);
    setMessages((old) => mergeChatMessages(old, page.items));
    setHasMore(page.hasMore);
    setLoading(false);
    if (AppState.currentState === "active") {
      await service.read();
      await reloadBadge();
    }
  }, [allowed, service, reloadBadge]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void refresh().catch((e) => {
        setLoading(false);
        notify(errorMessage(e), "danger");
      });
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active")
          void refresh().catch((e) => notify(errorMessage(e), "danger"));
      });
      return () => {
        focused.current = false;
        sub.remove();
      };
    }, [refresh, notify]),
  );
  useEffect(() => {
    if (connected)
      void refresh().catch((e) => notify(errorMessage(e), "danger"));
  }, [connected, reconnectSignal, refresh, notify]);
  useEffect(() => {
    if (
      !lastChat ||
      !allowed ||
      !focused.current ||
      lastChat.conversation.studentId !== user?.id
    )
      return;
    // Refetch the authoritative snapshot on each realtime event, including read receipts.
    // A read event does not trigger another read, preventing a feedback loop.
    let active = true;
    void service
      .messages()
      .then((page) => {
        if (!active || !focused.current) return;
        setConversation(lastChat.conversation);
        setMessages((old) => mergeChatMessages(old, page.items));
        if (
          lastChat.event === "MESSAGE_CREATED" &&
          lastChat.message?.senderRole === "STAFF" &&
          AppState.currentState === "active"
        )
          void service
            .read()
            .then(reloadBadge)
            .catch((e) => notify(errorMessage(e), "danger"));
      })
      .catch((e) => notify(errorMessage(e), "danger"));
    return () => {
      active = false;
    };
  }, [lastChat, allowed, user?.id, service, reloadBadge, notify]);
  const deliver = async (body: ChatSendRequest) => {
    try {
      const message = await service.send(body);
      pending.current.delete(body.clientMessageId);
      setMessages((old) => mergeChatMessages(old, [message]));
      void refresh().catch((e) => notify(errorMessage(e), "danger"));
      return true;
    } catch (e) {
      setMessages((old) =>
        old.map((m) =>
          m.clientMessageId === body.clientMessageId && m.delivery
            ? { ...m, delivery: "failed" }
            : m,
        ),
      );
      notify(errorMessage(e), "danger");
      return false;
    }
  };
  const send = async (content: string, files: ChatUpload[]) => {
    if (sending || !allowed) return false;
    setSending(true);
    try {
      const ids: string[] = [];
      for (const file of files) {
        file.id = await ChatAttachmentService.upload(request, file);
        ids.push(file.id);
      }
      const clientMessageId = randomUUID();
      const body: ChatSendRequest = {
        clientMessageId,
        content,
        attachmentIds: ids,
      };
      pending.current.set(clientMessageId, body);
      setMessages((old) =>
        mergeChatMessages(old, [
          {
            id: clientMessageId,
            conversationId: conversation?.id ?? "",
            clientMessageId,
            senderId: user?.id ?? "",
            senderRole: "STUDENT",
            senderName: user?.fullName ?? "",
            type: files.length ? "FILE" : "TEXT",
            content,
            attachments: files.map((f) => ({
              id: f.id!,
              fileName: f.name,
              url: f.uri,
              contentType: f.contentType,
              size: f.size,
              publicId: "",
            })),
            linkedRequestId: null,
            createdAt: new Date().toISOString(),
            delivery: "sending",
          },
        ]),
      );
      // A failed durable send is retried from its bubble using the same UUID.
      await deliver(body);
      return true;
    } catch (e) {
      notify(errorMessage(e), "danger");
      return false;
    } finally {
      setSending(false);
    }
  };
  const retry = async (message: ChatMessage) => {
    const body = pending.current.get(message.clientMessageId);
    if (!body) return;
    setMessages((old) =>
      old.map((m) =>
        m.clientMessageId === body.clientMessageId
          ? { ...m, delivery: "sending" }
          : m,
      ),
    );
    await deliver(body);
  };
  const loadMore = async () => {
    const first = messages.find((m) => !m.delivery);
    if (!first || !hasMore || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const page = await service.messages(first.createdAt, first.id);
      setMessages((old) => mergeChatMessages(old, page.items));
      setHasMore(page.hasMore);
    } catch (e) {
      notify(errorMessage(e), "danger");
    } finally {
      loadingMore.current = false;
    }
  };
  const rate = async (rating: number, comment: string) => {
    try {
      setConversation(await service.rate(rating, comment));
    } catch (e) {
      notify(errorMessage(e), "danger");
    }
  };
  return {
    conversation,
    messages,
    loading,
    hasMore,
    sending,
    send,
    retry,
    loadMore,
    rate,
  };
}
