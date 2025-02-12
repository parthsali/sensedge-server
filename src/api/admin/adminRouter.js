import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  deactivateUser,
  reactivateUser,
  createAdmin,
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

export default router;
