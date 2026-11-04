import type { ChatMessage, ChatMessageRow } from "../../models/chat.model";

/** Same rule as the web thread: consecutive messages from one sender within a minute form one group. */
export const CHAT_MESSAGE_GROUP_WINDOW_MS = 60_000;

export function canGroupChatMessages(
  previous: ChatMessage | undefined,
  current: ChatMessage | undefined,
): boolean {
  if (
    !previous ||
    !current ||
    previous.conversationId !== current.conversationId ||
    previous.senderId !== current.senderId ||
    previous.senderRole !== current.senderRole ||
    previous.type === "SYSTEM" ||
    current.type === "SYSTEM" ||
    previous.type === "NOTE" ||
    current.type === "NOTE" ||
    previous.delivery ||
    current.delivery
  )
    return false;
  const before = new Date(previous.createdAt);
  const after = new Date(current.createdAt);
  const gap = after.getTime() - before.getTime();
  return (
    gap >= 0 &&
    gap <= CHAT_MESSAGE_GROUP_WINDOW_MS &&
    before.toDateString() === after.toDateString()
  );
}

/** Calculate groups chronologically before FlatList reverses them for display. */
export function buildChatMessageRows(
  messages: readonly ChatMessage[],
): ChatMessageRow[] {
  const visible = messages.filter((message) => message.type !== "NOTE");
  return visible.map((message, index) => {
    const previous = visible[index - 1];
    const currentDate = new Date(message.createdAt);
    const previousDate = previous ? new Date(previous.createdAt) : undefined;
    const newDay =
      !previousDate ||
      previousDate.toDateString() !== currentDate.toDateString();
    const timeBreak =
      !!previousDate &&
      currentDate.getTime() - previousDate.getTime() >
        CHAT_MESSAGE_GROUP_WINDOW_MS;
    return {
      message,
      startsGroup: !canGroupChatMessages(previous, message),
      endsGroup: !canGroupChatMessages(message, visible[index + 1]),
      separator: newDay ? "date" : timeBreak ? "time" : null,
    };
  });
}

export function mergeChatMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const map = new Map(current.map((m) => [m.clientMessageId, m]));
  for (const message of incoming) {
    if (message.type === "NOTE") continue;
    const old = map.get(message.clientMessageId);
    if (!message.delivery || !old || old.delivery)
      map.set(message.clientMessageId, message);
  }
  return [...map.values()].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
