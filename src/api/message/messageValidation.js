import Joi from "joi";

export const sendMessageSchema = Joi.object({
  conversationId: Joi.string().required(),
  type: Joi.string().valid("text", "image", "video", "document").required(),
  text: Joi.string().when("type", { is: "text", then: Joi.required() }),
});

export const sendTemplateSchema = Joi.object({
  conversationId: Joi.string().required(),
  templateId: Joi.string().required(),
});
