import Joi from "joi";

export const customerValidation = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional().min(10).max(13),
  company: Joi.string().optional(),
  assigned_user: Joi.string().optional(),
});
