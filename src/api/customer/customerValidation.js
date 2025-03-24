import Joi from "joi";

export const customerValidation = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required().min(10).max(13),
  company: Joi.string().required(),
  assigned_user: Joi.string().required(),
});
