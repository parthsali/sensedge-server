import createHttpError from "http-errors";
import Customer from "./customerModel.js";
import { customerValidation } from "./customerValidation.js";
import Conversation from "../conversation/conversationModel.js";
import { v4 as uuidv4 } from "uuid";

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
      _id: `customer_${uuidv4()}`,
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

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().populate(
      "assigned_user",
      "name email"
    );

    res.status(200).json({
      message: "Customers retrieved successfully",
      customers,
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
