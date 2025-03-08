import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const userSchema = Joi.object({
  _id: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().required(),
  iat: Joi.number().required(),
  exp: Joi.number().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required(),
});

export const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required(),
});
