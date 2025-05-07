import Conversation from "./conversationModel.js";
import mongoose from "mongoose";

export const createUserToUserConversation = async (userIdOne, userIdTwo) => {
  try {
    const conversation = await Conversation.create({
      participants: [
        { participantId: userIdOne, participantModel: "User" },
        { participantId: userIdTwo, participantModel: "User" },
      ],
      conversationType: "user-to-user",
    });

    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const createUserToCustomerConversation = async (userId, customerId) => {
  try {
    const conversation = await Conversation.create({
      participants: [
        { participantId: userId, participantModel: "User" },
        { participantId: customerId, participantModel: "Customer" },
      ],
      conversationType: "user-to-customer",
    });

    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const updateUserToCustomerConversation = async (
  userId,
  customerId,
  conversationId
) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          participants: [
            { participantId: userId, participantModel: "User" },
            { participantId: customerId, participantModel: "Customer" },
          ],
        },
      },
      { new: true }
    );

    return conversation;
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }
};

export const getConversationsWithPopulatedParticipants = async (
  type,
  limit,
  skip,
  isAdmin,
  userId = null
) => {
  try {
    const findQuery = {
      conversationType: type,
    };

    if (!isAdmin) {
      findQuery.participants = {
        $elemMatch: {
          participantId: userId,
          participantModel: "User",
        },
      };
    }

    const conversations = await Conversation.find(findQuery)
      .populate({
        path: "lastMessage",
        model: "Message",
        select: "-__v",
        populate: {
          path: "author",
          select: "name",
        },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    if (!conversations || conversations.length === 0) {
      return [];
    }

    const populatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const populatedParticipants = await Promise.all(
          conversation.participants.map(async (participant) => {
            try {
              const ParticipantModel = getParticipantModel(
                participant.participantModel
              );

              let selectFields = "";
              if (participant.participantModel === "User") {
                selectFields = "name email";
              } else if (participant.participantModel === "Customer") {
                selectFields = "name phone company";
              } else {
                return null;
              }

              const participantDoc = await ParticipantModel.findById(
                participant.participantId
              )
                .select(selectFields)
                .lean()
                .exec();

              return participantDoc
                ? {
                    ...participantDoc,
                    _id: participant.participantId,
                    unreadCount: participant.unreadCount || 0,
                  }
                : null;
            } catch (error) {
              console.error(
                `Error populating participant ${participant.participantId} (Model: ${participant.participantModel}):`,
                error
              );
              return null;
            }
          })
        );

        conversation.participants = populatedParticipants.filter(
          (p) => p !== null
        );
        if (conversation.conversationType === "user-to-user") {
          const userParticipant = conversation.participants.find(
            (participant) => participant._id === userId
          );
          conversation.unreadCount = userParticipant?.unreadCount || 0;
        } else if (conversation.conversationType === "user-to-customer") {
          const userParticipant = conversation.participants.find(
            (participant) => participant._id.startsWith("user")
          );
          conversation.unreadCount = userParticipant?.unreadCount || 0;
        } else {
          conversation.unreadCount = 0;
        }

        return conversation;
      })
    );

    return populatedConversations;
  } catch (error) {
    console.error("Error in getConversationsWithPopulatedParticipants:", error);
    throw error;
  }
};

export const incrementUnreadCount = async (conversationId, userId) => {
  try {
    console.log(
      "Incrementing unread count for conversationId:",
      conversationId,
      "userId:",
      userId
    );
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        "participants.participantId": userId,
      },
      {
        $inc: { "participants.$.unreadCount": 1 },
      },
      { new: true }
    ).lean();

    return conversation;
  } catch (error) {
    console.error("Error incrementing unread count:", error);
    throw error;
  }
};

export const decrementUnreadCount = async (conversationId, userId) => {
  try {
    console.log(
      "Decrementing unread count for conversationId:",
      conversationId,
      "userId:",
      userId
    );
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        "participants.participantId": userId,
      },
      {
        $inc: { "participants.$.unreadCount": -1 },
      },
      { new: true }
    ).lean();

    return conversation;
  } catch (error) {
    console.error("Error decrementing unread count:", error);
    throw error;
  }
};

function getParticipantModel(modelName) {
  switch (modelName) {
    case "User":
      return mongoose.model("User");
    case "Customer":
      return mongoose.model("Customer");
    default:
      throw new Error(`Unknown participant model: ${modelName}`);
  }
}
