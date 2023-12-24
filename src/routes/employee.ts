import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import { createEmployee } from "../controllers/employee.controller";

const router = Router();

router
	.route("/employee")
	.post(validateToken, authorizePermission("HR", "admin"), createEmployee);

export default router;
