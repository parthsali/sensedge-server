import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["user", "customer", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "document"],
      required: true,
    },
    text: {
      type: String,
    },
    file: {
      type: {
        fileName: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        fileMimeType: {
          type: String,
        },
        fileSize: {
          type: Number,
        },
      },
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
