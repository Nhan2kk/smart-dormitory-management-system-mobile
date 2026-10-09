/** Người gửi một tin nhắn trong cuộc trò chuyện với Trợ lý AI. */
export enum ChatRole {
  User = "user",
  Assistant = "assistant",
}

/** Điểm đánh giá câu trả lời gửi backend (`rating` 1–5): mobile dùng 2 mức. */
export enum ChatFeedbackRating {
  NotHelpful = 1,
  Helpful = 5,
}
