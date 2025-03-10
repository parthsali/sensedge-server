import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  employeeId: Joi.string().required(),
  email: Joi.string().email().required(),
});
