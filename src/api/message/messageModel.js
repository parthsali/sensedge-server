import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    _id : {
      type: String,
      required: true
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    author: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return (
            v.startsWith("user") ||
            v.startsWith("customer") ||
            v.startsWith("admin")
          );
        },
        message: (props) => `${props.value} is not a valid author!`,
      },
      ref: function () {
        return this.author.startsWith("customer") ? "Customer" : "User";
      },
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
