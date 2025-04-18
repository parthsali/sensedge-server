import Config from "./configModel.js";
import createHttpError from "http-errors";
import User from "./userModel.js";
import Customer from "../customer/customerModel.js";

export const getDefaultUser = async (req, res, next) => {
  try {
    const config = await Config.findOne().populate("defaultUser", {
      password: 0,
      createdAt: 0,
      updatedAt: 0,
    });

    if (!config) {
      throw createHttpError(404, "Default user not found");
    }

    const defaultUser = config.defaultUser;

    if (!defaultUser) {
      throw createHttpError(404, "Default user not found");
    }

    res.status(200).json({ message: "Default user fetched", defaultUser });
  } catch (error) {
    next(error);
  }
};

export const setDefaultUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw createHttpError(400, "User ID is required");
    }
    const user = await User.findById(userId, {
      password: 0,
      createdAt: 0,
      updatedAt: 0,
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    let config = await Config.findOne();

    if (!config) {
      config = new Config();
    }

    config.defaultUser = userId;
    await config.save();

    res.status(200).json({ message: "Default user set", defaultUser: user });
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    const users = await User.find(
      {
        role: "user",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      {
        password: 0,
      }
    );

    const usersData = [];
    for (const user of users) {
      const customers = await Customer.find({ assigned_user: user._id });

      usersData.push({
        ...user._doc,
        customers,
      });
    }

    // get total count of users
    const totalUsers = await User.countDocuments({ role: "user" });

    res.status(200).json({
      message: "Users fetched",
      users: usersData,
      totalUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const setAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw createHttpError(400, "User ID is required");
    }

    const admin = await User.findById(userId, {
      password: 0,
      createdAt: 0,
      updatedAt: 0,
    });

    if (!admin) {
      throw createHttpError(404, "Admin not found");
    }

    const config = await Config.findOne();

    if (!config) {
      throw createHttpError(404, "Config not found");
    }

    config.admin = userId;
    await config.save();

    res.status(200).json({ message: "Admin set", admin });
  } catch (error) {
    next(error);
  }
};
