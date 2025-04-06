import createHttpError from "http-errors";
import Template from "./templateModel.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "./templateValidation.js";
import {
  addFile,
  getFileSignedUrl,
  deleteFile,
} from "../../services/awsService.js";

export const getTemplates = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const skip = (page - 1) * limit;

    const templates = await Template.find(
      {},
      {
        createdAt: 0,
        updatedAt: 0,
      }
    )
      .limit(limit)
      .skip(skip)
      .populate("createdBy", "name email");

    for (const template of templates) {
      const files = template.files || [];

      for (const file of files) {
        file.url = await getFileSignedUrl(file.url);
      }
    }

    const totalTemplates = await Template.countDocuments();

    res
      .status(200)
      .json({ message: "Templates fetched", templates, totalTemplates });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id, {
      createdAt: 0,
      updatedAt: 0,
    }).populate("createdBy", "name email");

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    const files = template.files || [];

    for (const file of files) {
      file.url = await getFileSignedUrl(file.url);
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

    const { name, text } = req.body;

    const existingTemplate = await Template.findOne({
      name,
    });

    if (existingTemplate) {
      throw createHttpError(400, "Template already exists");
    }

    const files = req.files || [];

    const mediaFiles = [];
    for (const file of files) {
      const uploadedFile = await addFile("templates", file);

      mediaFiles.push({
        name: file.originalname,
        type: getFileType(file.mimetype),
        url: uploadedFile,
        size: file.size,
        mimeType: file.mimetype,
      });
    }

    const user_id = req.user._id;

    console.log("user id", user_id);

    const template = new Template({
      name,
      text,
      files: mediaFiles,
      createdBy: user_id,
    });

    await template.save();

    for (const file of template.files) {
      file.url = await getFileSignedUrl(file.url);
    }

    res.status(201).json({ message: "Template created", template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await Template.findById(id);
    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    const { error } = updateTemplateSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, error);
    }

    let { name, text, deletedFiles } = req.body;

    if (!Array.isArray(deletedFiles)) {
      deletedFiles = typeof deletedFiles === "string" ? [deletedFiles] : [];
    }

    deletedFiles = deletedFiles.map(String);

    const newFiles = req.files || [];
    let updatedFiles = template.files || [];

    updatedFiles = updatedFiles.filter(
      (file) => !deletedFiles.includes(file._id.toString())
    );

    const filesToDelete = template.files.filter((file) =>
      deletedFiles.includes(file._id.toString())
    );

    for (const fileToDelete of filesToDelete) {
      await deleteFile(fileToDelete.url);
    }

    for (const file of newFiles) {
      const uploadedFile = await addFile("templates", file);

      updatedFiles.push({
        name: file.originalname,
        url: uploadedFile,
        type: getFileType(file.mimetype),
        size: file.size,
        mimeType: file.mimetype,
      });
    }

    template.name = name;
    template.text = text;
    template.files = updatedFiles;

    await template.save();

    for (const file of template.files) {
      file.url = await getFileSignedUrl(file.url);
    }

    res.status(200).json({ message: "Template updated", template });
  } catch (error) {
    next(error);
  }
};

export const searchTemplate = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const skip = (page - 1) * limit;

    const templates = await Template.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { text: { $regex: query, $options: "i" } },
        ],
      },
      {
        createdAt: 0,
        updatedAt: 0,
      }
    )
      .limit(limit)
      .skip(skip)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      message: "Templates fetched",
      templates,
    });
  } catch (error) {
    next(error);
  }
};
const getFileType = (mimeType) => {
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("video")) return "video";
  return "file";
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await Template.findByIdAndDelete(id);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }
    const files = template.files || [];
    for (const file of files) {
      await deleteFile(file.url);
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
