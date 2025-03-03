import Joi from "joi";

export const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  text: Joi.string().required(),
});
