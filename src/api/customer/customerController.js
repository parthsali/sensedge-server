import createHttpError from "http-errors";
import Customer from "./customerModel.js";
import {
  createCustomerValidation,
  customerValidation,
} from "./customerValidation.js";
import Config from "../user/configModel.js";

export const createCustomer = async (req, res, next) => {
  try {
    const { error } = createCustomerValidation.validate(req.body);

    if (error) {
      return next(createHttpError(400, error.details[0].message));
    }

    const { name, phone, company } = req.body;

    const config = await Config.findOne();

    const defaultUser = config.defaultUser || null;

    const customer = new Customer({
      name,
      phone,
      company,
      assigned_user: defaultUser,
    });

    await customer.save();

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
    const customers = await Customer.find();

    res.status(200).json(customers);
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
