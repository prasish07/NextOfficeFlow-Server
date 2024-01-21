import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import {
	createEmployee,
	updateEmployee,
	deleteEmployee,
	getAllEmployees,
	getEmployee,
} from "../controllers/employee.controller";

const router = Router();

router
	.route("/employee")
	.post(validateToken, authorizePermission("HR", "admin"), createEmployee)
	.get(getAllEmployees);

router
	.route("/employee/:employeeId")
	.get(validateToken, getEmployee)
	.patch(validateToken, authorizePermission("HR", "admin"), updateEmployee)
	.delete(validateToken, authorizePermission("HR", "admin"), deleteEmployee);

export default router;
