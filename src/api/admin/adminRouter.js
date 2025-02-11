import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  deleteUser,
  deactivateUser,
  reactivateUser,
} from "./adminController.js";
import { checkRole } from "../../middlewares/roleMiddleware.js";
import { auth } from "../../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/users", auth, checkRole("admin"), getUsers);

router.get("/users/:id", auth, checkRole("admin"), getUser);

router.post("/users", auth, checkRole("admin"), createUser);

router.delete("/users/:id", auth, checkRole("admin"), deleteUser);

router.put("/users/:id/deactivate", auth, checkRole("admin"), deactivateUser);

router.put("/users/:id/reactivate", auth, checkRole("admin"), reactivateUser);

export default router;
