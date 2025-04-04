import createHttpError from "http-errors";
import Customer from "./customerModel.js";
import { customerValidation } from "./customerValidation.js";
import Conversation from "../conversation/conversationModel.js";
import { customAlphabet } from "nanoid";
import xlsx from "xlsx";
import fs from "fs";
import Config from "../user/configModel.js";

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

    const customer = new Customer({
      _id: `customer-${nanoid()}`,
      name,
      phone,
      company,
      assigned_user,
    });

    await customer.save();

    // create a conversation for the customer
    const conversation = new Conversation({
      customer: customer._id,
      user: assigned_user,
      lastMessage: null,
    });

    await conversation.save();

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

    // use insertMany to bulk insert customers
    await Customer.insertMany(customers);

    // create a conversation for each customer
    const conversations = customers.map((customer) => {
      const conversation = new Conversation({
        customer: customer._id,
        user: customer.assigned_user,
        lastMessage: null,
      });

      return conversation.save();
    });

    await Promise.all(conversations);

    res.status(201).json({
      message: "Customers created successfully",
      customers,
    });
  } catch (error) {
    next(error);
  }
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

    // return customer with his conversation id
    const customersWithConversations = await Promise.all(
      customers.map(async (customer) => {
        const conversation = await Conversation.findOne({
          customer: customer._id,
        });
        return {
          ...customer._doc,
          conversationId: conversation ? conversation._id : null,
        };
      })
    );

    const totalCustomers = await Customer.countDocuments();

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

    customer.name = name;
    customer.phone = phone;
    customer.company = company;
    customer.assigned_user = assigned_user;

    await customer.save();
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

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
      ],
    });

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

    await Customer.bulkWrite(result);

    const conversations = result.map((customer) => {
      const conversation = new Conversation({
        customer: customer?.insertOne?.document?._id,
        user: customer?.insertOne?.document?.assigned_user,
        lastMessage: null,
      });

      return conversation.save();
    });

    // create a conversation for each customer

    await Promise.all(conversations);

    res.status(201).json({
      message: "Customers added successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
};
