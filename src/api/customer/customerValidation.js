import Joi from "joi";

export const customerValidation = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required().min(10).max(10),
  company: Joi.string().required(),
  assigned_user: Joi.string().required(),
});
