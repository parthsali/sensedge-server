import createHttpError from "http-errors";
import Message from "./messageModel.js";
import { sendMessageSchema, sendTemplateSchema } from "./messageValidation.js";
import { addFile } from "../../services/awsService.js";
import Conversation from "../conversation/conversationModel.js";
import Template from "../template/templateModel.js";

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

    const senderType = user.role === "user" ? "user" : "admin";

    if (type === "text") {
      const { text } = req.body;

      const newMessage = new Message({
        conversation: conversationId,
        senderType,
        type: "text",
        text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      return res.status(201).json({ message: "Message sent successfully" });
    }

    const file = req.file;

    if (!file) {
      throw createHttpError(400, "File is required");
    }

    const uploadedFile = await addFile("messages", file);

    const fileMimeType = file.mimetype.split("/")[1];

    const fileData = {
      fileName: file.originalname,
      fileUrl: uploadedFile,
      fileMimeType,
      fileSize: file.size,
    };

    console.log("fileData", fileData);

    const newMessage = new Message({
      conversation: conversationId,
      senderType,
      type,
      file: fileData,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    return res.status(201).json({ message: "Message sent successfully" });
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

    const senderType = "customer";

    if (type === "text") {
      const { text } = req.body;

      const newMessage = new Message({
        conversation: conversationId,
        senderType,
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

    const fileMimeType = file.mimetype.split("/")[1];

    const fileData = {
      fileName: file.originalname,
      fileUrl: uploadedFile,
      fileMimeType,
      fileSize: file.size,
    };

    console.log("fileData", fileData);

    const newMessage = new Message({
      conversation: conversationId,
      senderType,
      type,
      file: fileData,
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

    const senderType = user.role;

    if (template.text !== "") {
      const newMessage = new Message({
        conversation: conversationId,
        senderType,
        type: "text",
        text: template.text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });
    }

    const mediaFiles = template.mediaFiles || [];

    for (let i = 0; i < mediaFiles.length; i++) {
      const fileData = mediaFiles[i];

      const newMessage = new Message({
        conversation: conversationId,
        senderType,
        type: fileData.fileType,
        file: {
          fileName: fileData.fileName,
          fileUrl: fileData.fileUrl,
          fileSize: fileData.fileSize,
        },
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
