import createHttpError from "http-errors";
import { createUserSchema } from "./adminValidaion.js";
import User from "../user/userModel.js";
import Customer from "../customer/customerModel.js";
import Conversation from "../conversation/conversationModel.js";
import Message from "../message/messageModel.js";
import Template from "../template/templateModel.js";
import Config from "../user/configModel.js";

import { deleteFile } from "../../services/awsService.js";

import { sendUserDetailsTemplate } from "../../services/emailService.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" }, { password: 0 });

    res.status(200).json({
      message: "Users fetched",
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(createHttpError(400, "User ID is required"));
  }

  try {
    const user = await User.findById(id, { password: 0 });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    res.status(200).json({
      message: "User fetched",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { error } = createUserSchema.validate(req.body);

    if (error) {
      return next(createHttpError(400, error.message));
    }

    const { name, email } = req.body;

    // Check if the user already exists
    const user = await User.findOne({ email });

    if (user) {
      return next(createHttpError(400, "User already exists"));
    }

    // randomly generate 6 digit password
    const password = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({ name, email, password });

    await newUser.save();

    // Send the user details to the user's email
    await sendUserDetailsTemplate(name, email, password);

    res.status(201).json({ message: "User created" });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createHttpError(400, "User ID is required"));
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createHttpError(400, "User ID is required"));
    }

    const user = await User.findByIdAndUpdate(id, { isActive: false });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    res.status(200).json({ message: "User deactivated" });
  } catch (error) {
    next(error);
  }
};

export const reactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createHttpError(400, "User ID is required"));
    }

    const user = await User.findByIdAndUpdate(id, { isActive: true });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    res.status(200).json({ message: "User reactivated" });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { error } = createUserSchema.validate(req.body);

    if (error) {
      return next(createHttpError(400, error.message));
    }

    const { name, email } = req.body;

    // Check if the user already exists
    const user = await User.findOne({ email });

    if (user) {
      return next(createHttpError(400, "User already exists"));
    }

    // randomly generate 6 digit password
    const password = Math.floor(100000 + Math.random() * 900000).toString();

    const newAdmin = new User({ name, email, password, role: "admin" });

    await newAdmin.save();

    // Send the user details to the user's email
    await sendUserDetailsTemplate(name, email, password);

    res.status(201).json({ message: "Admin created" });
  } catch (error) {
    next(error);
  }
};

// dev only

export const deleteUsers = async (req, res, next) => {
  try {
    await User.deleteMany({ role: "user" });

    res.status(200).json({ message: "Users deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomers = async (req, res, next) => {
  try {
    await Customer.deleteMany();

    res.status(200).json({ message: "Customers deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmins = async (req, res, next) => {
  try {
    await User.deleteMany({ role: "admin" });

    res.status(200).json({ message: "Admins deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteConversations = async (req, res, next) => {
  try {
    await Conversation.deleteMany();

    res.status(200).json({ message: "Conversations deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteMessages = async (req, res, next) => {
  try {
    const messages = await Message.find();

    for (const message of messages) {
      if (["image", "video", "document"].includes(message.type)) {
        await deleteFile(message.file.fileUrl);
      }
    }

    await Message.deleteMany();

    res.status(200).json({ message: "Messages deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find();

    for (const template of templates) {
      const mediaFiles = template.mediaFiles || [];

      for (const mediaFile of mediaFiles) {
        await deleteFile(mediaFile.fileUrl);
      }
    }

    await Template.deleteMany();

    res.status(200).json({ message: "Templates deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteConfig = async (req, res, next) => {
  try {
    await Config.deleteMany();

    res.status(200).json({ message: "Config deleted" });
  } catch (error) {
    next(error);
  }
};
