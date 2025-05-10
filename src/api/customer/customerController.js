import createHttpError from "http-errors";
import Config from "../user/configModel.js";
import Customer from "./customerModel.js";
import { customerValidation } from "./customerValidation.js";
import Conversation from "../conversation/conversationModel.js";
import { customAlphabet } from "nanoid";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import User from "../user/userModel.js";
import { createUserToCustomerConversation } from "../conversation/conversationUtils.js";
import { logInfo, logDebug } from "../../utils/logger.js";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export const createCustomer = async (req, res, next) => {
  try {
    const { error } = customerValidation.validate(req.body);

    if (error) {
      return next(createHttpError(400, error.details[0].message));
    }

    const { name, phone, company, assigned_user } = req.body;

    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return next(createHttpError(400, "Customer already exists"));
    }

    let userToAssign = assigned_user;

    if (!userToAssign) {
      const config = await Config.findOne();
      if (!config || !config.defaultUser) {
        return next(createHttpError(500, "Default user not found"));
      }
      userToAssign = config.defaultUser;
    } else {
      const userExists = await User.findById(userToAssign);
      if (!userExists) {
        return next(createHttpError(400, "User does not exist"));
      }
    }

    const customer = new Customer({
      _id: `customer-${nanoid()}`,
      name,
      phone,
      company,
      assigned_user: userToAssign,
    });

    await customer.save();
    logInfo(
      `Customer created successfully: ${customer._id} by ${
        req.user?.email || "unknown user"
      }`
    );

    await createUserToCustomerConversation(
      customer.assigned_user,
      customer._id
    );

    logInfo(
      `Conversation created for customer: ${customer._id} and user: ${customer.assigned_user}`
    );

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomers = async (req, res, next) => {
  try {
    const { file } = req;

    if (!file) {
      return next(createHttpError(400, "File is required"));
    }

    const tempFilePath = file.path;

    const workbook = xlsx.readFile(tempFilePath);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet);

    fs.unlinkSync(tempFilePath);

    const customers = [];

    const config = await Config.findOne();

    if (!config) {
      return next(createHttpError(500, "Default user not found"));
    }

    for (const customer of data) {
      const name = customer.Name;
      const phone = String(customer.Phone);
      const company = customer.Company;

      const customerExists = await Customer.findOne({ phone: phone });

      if (customerExists) {
        continue;
      }

      const assigned_user = config.defaultUser;

      const customerData = {
        name: name || "Not provided",
        phone: phone || "910000000000",
        company: company || "Not provided",
        assigned_user,
      };

      const { error } = customerValidation.validate(customerData);

      if (error) {
        console.error(error.details[0].message);
        continue;
      }

      customers.push({
        _id: `customer-${nanoid()}`,
        ...customerData,
      });
    }

    if (customers.length === 0) {
      return next(createHttpError(400, "No customers to create"));
    }

    await Customer.insertMany(customers);

    for (const customer of customers) {
      await createUserToCustomerConversation(
        customer.assigned_user,
        customer._id
      );
    }

    logInfo(
      `Customers created successfully: ${customers
        .map((customer) => customer.name)
        .join(", ")}`
    );

    res.status(201).json({
      message: "Customers created successfully",
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadTemplate = async (req, res, next) => {
  // current directory
  const currentDir = process.cwd();

  const filePath = path.join(
    currentDir,
    "public",
    "templates",
    "customer-template.xlsx"
  );

  if (!fs.existsSync(filePath)) {
    return next(createHttpError(404, "Template not found"));
  }

  res.download(filePath, "Customer-Template.xlsx", (err) => {
    if (err) {
      console.error(err);
      return next(createHttpError(500, "Error downloading template"));
    }
  });
};

export const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const customers = await Customer.find()
      .populate("assigned_user", "name email")
      .skip(skip)
      .limit(limit);

    const customersWithConversations = await Promise.all(
      customers.map(async (customer) => {
        const conversation = await Conversation.findOne({
          "participants.participantId": customer._id,
          "participants.participantModel": "Customer",
        });
        return {
          ...customer._doc,
          conversationId: conversation ? conversation._id : null,
        };
      })
    );

    const totalCustomers = await Customer.countDocuments();
    logDebug(`getCustomers called by ${req.user?.email || "unknown user"}`);
    res.status(200).json({
      message: "Customers retrieved successfully",
      customers: customersWithConversations,
      totalCustomers,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { error } = customerValidation.validate(req.body);

    if (error) {
      return next(createHttpError(400, error.details[0].message));
    }

    const { name, phone, company, assigned_user } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }

    const userExists = await User.findById(assigned_user);

    if (!userExists) {
      return next(createHttpError(400, "User does not exist"));
    }

    customer.name = name;
    customer.phone = phone;
    customer.company = company;
    customer.assigned_user = assigned_user;

    await customer.save();

    logInfo(
      `Customer updated successfully: ${customer._id} by ${
        req.user?.email || "unknown user"
      }`
    );

    res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "assigned_user",
      "name email"
    );

    if (!customer) {
      return next(createHttpError(404, "Customer not found"));
    }

    logDebug(`getCustomer called by ${req.user?.email || "unknown user"}`);
    res.status(200).json({
      message: "Customer retrieved successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const searchCustomer = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return next(createHttpError(400, "Query is required"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
      ],
    })
      .populate("assigned_user", "name email")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Customers retrieved successfully",
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAdd = async (req, res, next) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers)) {
      return next(createHttpError(400, "Customers should be an array"));
    }

    console.log("Step 1: customers", customers);
    // use insertMany to bulk insert customers
    const result = customers.map((customer) => {
      return {
        insertOne: {
          document: {
            _id: `customer-${nanoid()}`,
            ...customer,
          },
        },
      };
    });

    console.log("Step 2: result", result);

    await Customer.bulkWrite(result);

    console.log("Step 3: bulkWrite completed", result);
    for (const customer of result) {
      console.log("Step 4: customer", customer);
      const customerId = customer?.insertOne?.document?._id;
      const assignedUserId = customer?.insertOne?.document?.assigned_user;

      if (customerId && assignedUserId) {
        console.log(
          "Creating conversation for customerId",
          customerId,
          "and assignedUserId",
          assignedUserId
        );
        await createUserToCustomerConversation(assignedUserId, customerId);
      }
    }

    res.status(201).json({
      message: "Customers added successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
};
