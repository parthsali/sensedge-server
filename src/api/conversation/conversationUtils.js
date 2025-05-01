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

              return participantDoc;
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

        return conversation;
      })
    );

    return populatedConversations;
  } catch (error) {
    console.error("Error in getConversationsWithPopulatedParticipants:", error);
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
