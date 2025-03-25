import express from "express";
import {
  sendMessage,
  receiveMessage,
  sendTemplate,
  updateMessageStatus,
  searchMessage,
  handleWebhook,
} from "./messageController.js";
import { auth } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multerMiddleware.js";

const router = express.Router();

router.post("/send-message", auth, upload.single("file"), sendMessage);

router.patch("/:messageId/status", auth, updateMessageStatus);

router.post("/receive-message", auth, upload.single("file"), receiveMessage);

router.post("/send-template", auth, sendTemplate);

router.get("/search", auth, searchMessage);

router.post("/webhook", handleWebhook);

router.get("/webhook", (req, res) => {
  return res.status(200).json({ message: "Webhook is working" });
}
);


export default router;
