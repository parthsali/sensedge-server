import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    author: {
      type: String,
      ref: "User" || "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      required: true,
    },
    text: {
      type: String,
    },
    name: {
      type: String,
    },
    size: {
      type: Number,
    },
    url: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
