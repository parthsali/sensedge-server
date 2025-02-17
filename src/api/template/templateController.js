import createHttpError from "http-errors";
import Template from "./templateModel.js";
import { createTemplateSchema } from "./templateValidation.js";

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find();
    res.status(200).json({ message: "Templates fetched", templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    res.status(200).json({ message: "Template fetched", template });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { error } = createTemplateSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error);
    }

    const { name, content } = req.body;

    const existingTemplate = await Template.findOne({
      name,
    });

    if (existingTemplate) {
      throw createHttpError(400, "Template already exists");
    }

    const template = new Template({
      name,
      content,
    });

    await template.save();

    res.status(201).json({ message: "Template created", template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = createTemplateSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error);
    }

    const { name, content } = req.body;

    const template = await Template.findById(id);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    template.name = name;
    template.content = content;

    await template.save();

    res.status(200).json({ message: "Template updated", template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await Template.findByIdAndDelete(id);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    res.status(200).json({ message: "Template deleted" });
  } catch (error) {
    next(error);
  }
};
