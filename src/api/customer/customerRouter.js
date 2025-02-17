import express from "express";
import {
  createCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "./customerController.js";
import { auth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-customer", auth, createCustomer);
router.get("/get-customers", auth, getCustomers);
router.get("/get-customer/:id", auth, getCustomer);
router.put("/update-customer/:id", auth, updateCustomer);
export default router;
