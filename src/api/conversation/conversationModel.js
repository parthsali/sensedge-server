import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        participantId: {
          type: String,
          required: true,
        },
        participantModel: {
          type: String,
          enum: ["User", "Customer"],
          required: true,
        },
        unreadCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    conversationType: {
      type: String,
      enum: ["user-to-user", "user-to-customer"],
      required: true,
    },
    lastMessage: {
      type: String,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
