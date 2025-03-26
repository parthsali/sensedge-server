import express from "express";
import {
  getDefaultUser,
  setDefaultUser,
  searchUser,
  setAdmin
} from "./userController.js";
import { auth } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/get-default-user", auth, checkRole("admin"), getDefaultUser);
router.put("/set-default-user", auth, checkRole("admin"), setDefaultUser);

router.put("/set-admin", auth, checkRole("admin"), setAdmin);

router.get("/search", auth, searchUser);

export default router;
