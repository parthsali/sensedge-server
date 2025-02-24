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
    content: {
      type: String,
      required: true,
    },
    mediaFiles: {
      type: [
        {
          fileName: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
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
