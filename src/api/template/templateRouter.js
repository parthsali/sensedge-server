import express from "express";
import {
  createTemplate,
  getTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
} from "./templateController.js";

import { auth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/get-templates", auth, getTemplates);
router.get("/get-template/:id", auth, getTemplate);

router.post("/create-template", auth, createTemplate);
router.put("/update-template/:id", auth, updateTemplate);

router.delete("/delete-template/:id", auth, deleteTemplate);

export default router;
