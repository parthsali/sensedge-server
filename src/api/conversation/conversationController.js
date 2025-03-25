import createHttpError from "http-errors";
import Conversation from "./conversationModel.js";
import Message from "../message/messageModel.js";
import Customer from "../customer/customerModel.js";
import User from "../user/userModel.js";
import { getFileSignedUrl } from "../../services/awsService.js";

export const getAllConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({}, { createdAt: 0 })
      .populate("user", "name email")
      .populate("customer", "name phone company")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip);

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    for (const conversation of conversations) {
      if (["image", "video", "file"].includes(conversation.lastMessage?.type)) {
        conversation.lastMessage.url = await getFileSignedUrl(
          conversation.lastMessage.url
        );
      }
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const conversations = await Conversation.find(
      { user: req.user._id },
      { user: 0, createdAt: 0 }
    )
      .populate("customer", "name phone company")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip);

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    for (const conversation of conversations) {
      if (["image", "video", "file"].includes(conversation.lastMessage?.type)) {
        conversation.lastMessage.url = await getFileSignedUrl(
          conversation.lastMessage.url
        );
      }
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

    const messages = await Message.find(
      { conversation: req.params.id },
      { conversation: 0, updatedAt: 0 , isAWSUrl: 0}
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate({
        path: "author",
        select: "name ",
      });

    for (const message of messages) {
      if (["image", "video", "file"].includes(message.type)) {
        message.url = await getFileSignedUrl(message.url);
      }
    }

    res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (error) {
    next(createHttpError(500, error.message));
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

    const { userId, customerId } = req.body;

    if (!userId) {
      return next(createHttpError(400, "User id is required"));
    }

    if (!customerId) {
      return next(createHttpError(400, "Customer id is required"));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { assigned_user: user._id },
      { new: true }
    );

    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }

    conversation.user = user._id;
    conversation.customer = customer._id;

    await conversation.save();
    await customer.save();

    res.status(200).json({ message: "Conversation reassigned successfully" });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};

export const searchConversation = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return next(createHttpError(400, "Query is required"));
    }

    const conversations = await Conversation.find({}, { createdAt: 0 })
      .populate("user", "name email")
      .populate("customer", "name phone company")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .exec();

    const filteredConversations = conversations.filter((conversation) => {
      return (
        conversation.customer?.name
          ?.toLowerCase()
          .includes(query.toLowerCase()) ||
        conversation.customer?.phone?.includes(query) ||
        conversation.customer?.company
          ?.toLowerCase()
          .includes(query.toLowerCase()) ||
        conversation.lastMessage?.text
          ?.toLowerCase()
          .includes(query.toLowerCase()) ||
        conversation.lastMessage?.name
          ?.toLowerCase()
          .includes(query.toLowerCase())
      );
    });

    filteredConversations.forEach((conversation) => {
      if (["image", "video", "file"].includes(conversation.lastMessage?.type)) {
        conversation.lastMessage.url = getFileSignedUrl(
          conversation.lastMessage.url
        );
      }
    });

    res.status(200).json({
      message: "Conversations fetched successfully",
      conversations: filteredConversations,
    });
  } catch (error) {
    next(createHttpError(500, "Internal server error"));
  }
};
