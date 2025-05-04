import createHttpError from "http-errors";
import Conversation from "./conversationModel.js";
import Message from "../message/messageModel.js";
import Customer from "../customer/customerModel.js";
import User from "../user/userModel.js";
import { getFileSignedUrl } from "../../services/awsService.js";
import { getConversationsWithPopulatedParticipants } from "./conversationUtils.js";

export const getAllConversations = async (req, res, next) => {
  try {
    const type = req.query.type || "user-to-customer";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const isAdmin = req.user.role === "admin";

    const conversations = await getConversationsWithPopulatedParticipants(
      type,
      limit,
      skip,
      isAdmin
    );

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
    console.error(error);
    next(createHttpError(500, "Internal server error"));
  }
};

export const getUserConversations = async (req, res, next) => {
  try {
    const type = req.query.type || "user-to-customer";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const isAdmin = false;

    const conversations = await getConversationsWithPopulatedParticipants(
      type,
      limit,
      skip,
      isAdmin,
      userId
    );

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    for (const conversation of conversations) {
      if (
        ["image", "video", "file"].includes(conversation?.lastMessage?.type)
      ) {
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

    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find(
      { conversation: req.params.id },
      { conversation: 0, updatedAt: 0 }
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

export const getStarredMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    if (
      !conversation.participants.some(
        (participant) => participant.toString() === req.user._id.toString()
      ) &&
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
      { conversation: id, isStarred: true },
      { conversation: 0, updatedAt: 0 }
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

    conversation.participants = [user._id, customer._id];

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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const skip = (page - 1) * limit;

    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";
    const type = req.query.type || "user-to-customer";

    const conversations = await getConversationsWithPopulatedParticipants(
      type,
      limit,
      skip,
      isAdmin,
      userId
    );

    if (!conversations) {
      return next(createHttpError(404, "Conversations not found"));
    }

    const filteredConversations = conversations.filter((conversation) => {
      return (
        conversation.participants.some((participant) => {
          if (participant._id.toString() === req.user._id.toString()) {
            return false;
          }
          return (
            participant.name?.toLowerCase().includes(query.toLowerCase()) ||
            participant.phone?.includes(query) ||
            participant.company?.toLowerCase().includes(query.toLowerCase())
          );
        }) ||
        conversation.lastMessage?.text
          ?.toLowerCase()
          .includes(query.toLowerCase()) ||
        conversation.lastMessage?.name
          ?.toLowerCase()
          .includes(query.toLowerCase())
      );
    });

    console.log("Filtered conversations:", filteredConversations);

    for (const conversation of filteredConversations) {
      if (["image", "video", "file"].includes(conversation.lastMessage?.type)) {
        conversation.lastMessage.url = await getFileSignedUrl(
          conversation.lastMessage.url
        );
      }
    }

    res.status(200).json({
      message: "Conversations fetched successfully",
      conversations: filteredConversations,
    });
  } catch (error) {
    next(createHttpError(500, error));
  }
};
