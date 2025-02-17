import express from "express";
import { getDefaultUser, setDefaultUser } from "./userController.js";

const router = express.Router();

router.get("/get-default-user", getDefaultUser);
router.put("/set-default-user", setDefaultUser);

export default router;
