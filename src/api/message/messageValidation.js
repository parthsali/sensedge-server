import Joi from "joi";

export const sendMessageSchema = Joi.object({
  conversationId: Joi.string().required(),
  content: Joi.string().required(),
});
