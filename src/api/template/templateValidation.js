import Joi from "joi";

export const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  text: Joi.string().required(),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string().required(),
  text: Joi.string().required(),
  deletedFiles: Joi.alternatives().try(
    Joi.array().items(Joi.string()).optional(),
    Joi.string().optional()
  ),
});
