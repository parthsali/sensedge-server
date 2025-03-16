import express from "express";
import {
  getAllConversations,
  getConversationMessages,
  getUserConversations,
  reassignConversation,
  searchConversation,
} from "./conversationController.js";

import { auth } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// admin
router.get("/get-conversations", auth, checkRole("admin"), getAllConversations);
router.patch(
  "/reassign-conversation/:id",
  auth,
  checkRole("admin"),
  reassignConversation
);

// user
router.get("/get-user-conversations", auth, getUserConversations);
router.get("/get-conversation-messages/:id", auth, getConversationMessages);

router.get("/search", auth, searchConversation);

export default router;
