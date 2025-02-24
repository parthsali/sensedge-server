import createHttpError from "http-errors";
import Conversation from "./conversationModel.js";
import Message from "../message/messageModel.js";
import { getFileSignedUrl } from "../../services/awsService.js";

export const getAllConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find()
      .populate("user", "name email")
      .populate("customer", "name phone company")
      .populate("lastMessage", "senderType content mediaFiles createdAt");

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    res
      .status(200)
      .json({ message: "Conversations fetched successfully", conversations });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};

export const getUserConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .populate("customer", "name phone company")
      .populate("lastMessage", "senderType content mediaFiles createdAt");

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    res.status(200).json({ conversations });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    // check if that conversation exists
    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    // check if the user is allowed to view the conversation
    if (
      conversation.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        createHttpError(403, "You are not allowed to view this conversation")
      );
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.id })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(skip);

    for (const message of messages) {
      if (message.mediaFiles && message.mediaFiles.length > 0) {
        for (let i = 0; i < message.mediaFiles.length; i++) {
          message.mediaFiles[i].fileName = await getFileSignedUrl(
            message.mediaFiles[i].fileName
          );
        }
      }
    }

    res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};

export const reassignConversation = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    if (!conversationId) {
      return next(createHttpError(400, "Conversation id is required"));
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const { userId } = req.body;

    if (!userId) {
      return next(createHttpError(400, "User id is required"));
    }

    conversation.user = userId;

    await conversation.save();

    res.status(200).json({ message: "Conversation reassigned successfully" });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};
