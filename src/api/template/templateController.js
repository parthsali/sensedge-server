import createHttpError from "http-errors";
import Template from "./templateModel.js";
import { createTemplateSchema } from "./templateValidation.js";
import {
  addFile,
  getFileSignedUrl,
  deleteFile,
} from "../../services/awsService.js";

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find();

    for (const template of templates) {
      const mediaFiles = template.mediaFiles || [];

      for (const file of mediaFiles) {
        file.fileName = await getFileSignedUrl(file.fileName);
      }
    }

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

    const mediaFiles = template.mediaFiles || [];

    for (const file of mediaFiles) {
      console.log(file.fileName);
      file.fileName = await getFileSignedUrl(file.fileName);
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

    const files = req.files || [];

    const mediaFiles = [];

    for (const file of files) {
      const uploadedFile = await addFile("templates", file);

      console.log("uploadedFile", uploadedFile);

      mediaFiles.push({
        fileName: uploadedFile,
        type: file.mimetype.split("/")[1],
      });
    }

    const existingTemplate = await Template.findOne({
      name,
    });

    if (existingTemplate) {
      throw createHttpError(400, "Template already exists");
    }

    const user_id = req.user._id;

    const template = new Template({
      name,
      content,
      mediaFiles,
      createdBy: user_id,
    });

    await template.save();

    for (const file of template.mediaFiles) {
      file.fileName = await getFileSignedUrl(file.fileName);
    }

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

    const files = req.files || [];

    const mediaFiles = [];

    for (const file of files) {
      const uploadedFile = await addFile("templates", file);

      mediaFiles.push({
        fileName: uploadedFile,
        type: file.mimetype.split("/")[1],
      });
    }

    const template = await Template.findById(id);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    template.name = name;
    template.content = content;
    template.mediaFiles = mediaFiles;

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

    for (const file of template.mediaFiles) {
      await deleteFile(file.fileName);
    }

    res.status(200).json({ message: "Template deleted" });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createHttpError(400, "Please upload an image");
    }
    console.log("req.file", req.file);
    const fileName = await addFile("templates", req.file);

    res.status(200).json({ message: "Image uploaded", fileName });
  } catch (error) {
    next(error);
  }
};

export const getFileUrl = async (req, res, next) => {
  const key = "1740378207399-card.jpg";
  try {
    const url = await getFileSignedUrl(key);

    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};
