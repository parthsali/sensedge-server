import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      ref: "Customer",
    },
    user: {
      type: String,
      ref: "User",
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      type: String,
      ref: "Message",
      default : null
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
