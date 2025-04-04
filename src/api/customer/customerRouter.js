import express from "express";
import {
  createCustomer,
  createCustomers,
  getCustomer,
  getCustomers,
  updateCustomer,
  bulkAdd,
  searchCustomer,
  downloadTemplate,
} from "./customerController.js";
import { auth } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multerMiddleware.js";

const router = express.Router();

router.post("/create-customer", auth, createCustomer);

router.get("/download-template", downloadTemplate);
router.post("/create-customers", auth, upload.single("file"), createCustomers);

router.get("/get-customers", auth, getCustomers);
router.get("/get-customer/:id", auth, getCustomer);
router.put("/update-customer/:id", auth, updateCustomer);

router.get("/search", auth, searchCustomer);

router.post("/bulk-add", auth, bulkAdd);

export default router;
