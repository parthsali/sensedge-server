import createHttpError from "http-errors";
import Message from "./messageModel.js";
import { sendMessageSchema } from "./messageValidation.js";
import { addFile } from "../../services/awsService.js";
import Conversation from "../conversation/conversationModel.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, content } = req.body;

    const user = req.user;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    if (
      conversation.user.toString() !== req.user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to send messages to this conversation"
      );
    }

    const senderType = user.role === "user" ? "user" : "admin";

    const files = req.files || [];

    const mediaFiles = [];

    for (const file of files) {
      const fileName = await addFile("messages", file);
      const type = file.mimetype.split("/")[1];

      mediaFiles.push({ fileName, type });
    }

    const newMessage = new Message({
      conversation: conversationId,
      senderType,
      content,
      mediaFiles,
    });

    await newMessage.save();

    // update last message in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage,
    });

    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    next(err);
  }
};
