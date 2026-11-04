/* eslint-disable @typescript-eslint/no-redeclare */
export const ChatSenderRole = { Student: "STUDENT", Staff: "STAFF" } as const;
export type ChatSenderRole =
  (typeof ChatSenderRole)[keyof typeof ChatSenderRole];
export const ChatMessageType = {
  Text: "TEXT",
  Image: "IMAGE",
  File: "FILE",
  System: "SYSTEM",
  Note: "NOTE",
} as const;
export type ChatMessageType =
  (typeof ChatMessageType)[keyof typeof ChatMessageType];
export const ChatConversationStatus = {
  Open: "OPEN",
  Closed: "CLOSED",
} as const;
export type ChatConversationStatus =
  (typeof ChatConversationStatus)[keyof typeof ChatConversationStatus];
export const ChatRealtimeEventType = {
  MessageCreated: "MESSAGE_CREATED",
  Updated: "CONVERSATION_UPDATED",
  Read: "CONVERSATION_READ",
} as const;
export type ChatRealtimeEventType =
  (typeof ChatRealtimeEventType)[keyof typeof ChatRealtimeEventType];
