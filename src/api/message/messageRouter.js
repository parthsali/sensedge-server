import express from "express";
import { sendMessage } from "./messageController.js";
import { auth } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multerMiddleware.js";

const router = express.Router();

router.post("/send-message", auth, upload.array("files", 10), sendMessage);

export default router;
