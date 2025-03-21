import createHttpError from "http-errors";
import Message from "./messageModel.js";
import { sendMessageSchema, sendTemplateSchema } from "./messageValidation.js";
import { addFile } from "../../services/awsService.js";
import Conversation from "../conversation/conversationModel.js";
import Template from "../template/templateModel.js";
import { getFileSignedUrl } from "../../services/awsService.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, type } = req.body;

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

    const author = user._id;

    if (type === "text") {
      const { text } = req.body;

      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: "text",
        text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      return res.status(201).json({ message: newMessage });
    }

    const file = req.file;

    if (!file) {
      throw createHttpError(400, "File is required");
    }

    const uploadedFile = await addFile("messages", file);

    const newMessage = new Message({
      conversation: conversationId,
      author,
      type,
      name: file.originalname,
      size: file.size,
      url: uploadedFile,
      mimeType: file.mimetype,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    newMessage.url = await getFileSignedUrl(newMessage.url);

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

export const updateMessageStatus = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      throw createHttpError(404, "Message not found");
    }

    const user = req.user;

    if (
      message.author.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to update the status of this message"
      );
    }

    const { status } = req.body;

    if (status !== "read") {
      throw createHttpError(400, "Invalid status");
    }

    message.status = status;

    await message.save();

    return res
      .status(200)
      .json({ message: "Message status updated", updatedMessage: message });
  } catch (err) {
    next(err);
  }
};

export const receiveMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, type } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const author = conversation.customer;

    if (!author) {
      throw createHttpError(404, "Customer not found");
    }

    if (type === "text") {
      const { text } = req.body;

      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: "text",
        text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      return res
        .status(201)
        .json({ message: "Message sent by customer successfully" });
    }

    const file = req.file;

    if (!file) {
      throw createHttpError(400, "File is required");
    }

    const uploadedFile = await addFile("messages", file);

    const newMessage = new Message({
      conversation: conversationId,
      author,
      type,
      name: file.originalname,
      size: file.size,
      url: uploadedFile,
      mimeType: file.mimetype,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    return res
      .status(201)
      .json({ message: "Message sent by customer successfully" });
  } catch (err) {
    next(err);
  }
};

export const sendTemplate = async (req, res, next) => {
  try {
    const { error } = sendTemplateSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, templateId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const template = await Template.findById(templateId);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    const user = req.user;

    // check if the user is allowed to send the template in that conversation or user is admin
    if (
      conversation.user.toString() !== req.user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to send this template to this conversation"
      );
    }

    const author = user._id;

    if (template.text !== "") {
      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: "text",
        text: template.text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });
    }

    const files = template.files || [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: fileData.type,
        name: fileData.name,
        size: fileData.size,
        url: fileData.url,
        mimeType: fileData.mimeType,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });
    }

    return res.status(201).json({ message: "Template sent successfully" });
  } catch (err) {
    next(err);
  }
};

export const searchMessage = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    const messages = await Message.find({
      $or: [
        { text: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });

    if (!messages) {
      throw createHttpError(404, "No messages found");
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.type !== "text") {
        message.url = await getFileSignedUrl(message.url);
      }
    }

    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};
