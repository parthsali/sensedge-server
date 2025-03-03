import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  deactivateUser,
  reactivateUser,
  createAdmin,
  deleteUsers,
  deleteCustomers,
  deleteAdmins,
  deleteConversations,
  deleteMessages,
  deleteTemplates,
  deleteConfig,
} from "./adminController.js";
import { checkRole } from "../../middlewares/roleMiddleware.js";
import { auth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/users/get-users", auth, checkRole("admin"), getUsers);

router.get("/users/get-user/:id", auth, checkRole("admin"), getUser);

router.post("/users/create-user", auth, checkRole("admin"), createUser);

router.post("/users/create-admin", auth, checkRole("admin"), createAdmin);

router.put("/users/deactivate/:id", auth, checkRole("admin"), deactivateUser);

router.put("/users/reactivate/:id", auth, checkRole("admin"), reactivateUser);

// for dev
router.delete("/users", auth, checkRole("admin"), deleteUsers);
router.delete("/customers", auth, checkRole("admin"), deleteCustomers);
router.delete("/", auth, checkRole("admin"), deleteAdmins);
router.delete("/conversations", auth, checkRole("admin"), deleteConversations);
router.delete("/messages", auth, checkRole("admin"), deleteMessages);
router.delete("/templates", auth, checkRole("admin"), deleteTemplates);
router.delete("/config", auth, checkRole("admin"), deleteConfig);

export default router;
