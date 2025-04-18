import express from "express";
import {
  createTemplate,
  getTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  searchTemplate,
  getFileUrl,
  uploadImage,
} from "./templateController.js";

import { auth } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multerMiddleware.js";
import { checkRole } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/get-templates", auth, getTemplates);
router.get("/get-template/:id", auth, getTemplate);

router.get("/search", auth, searchTemplate);

router.post(
  "/create-template",
  auth,
  upload.array("files", 10),
  createTemplate
);
router.put(
  "/update-template/:id",
  auth,
  upload.array("files", 10),
  updateTemplate
);

router.delete("/delete-template/:id", auth, deleteTemplate);

router.post("/upload-image", auth, upload.single("file"), uploadImage);

router.get("/get-file-url", auth, getFileUrl);

export default router;
