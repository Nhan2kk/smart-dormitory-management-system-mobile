import type { ChatMessage } from "../../models/chat.model";
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
