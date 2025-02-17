import Joi from "joi";

export const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  content: Joi.string().required(),
  //   mediaFiles: Joi.array().items(
  //     Joi.object({
  //       url: Joi.string().required(),
  //       type: Joi.string().valid("image", "pdf", "video", "other").required(),
  //     })
  //   ),
});
