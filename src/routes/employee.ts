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
	getUserInformation,
	getAllUserWithEmployeeRole,
	getEmployeeByUserId,
} from "../controllers/employee.controller";

const router = Router();

router
	.route("/employee")
	.post(validateToken, authorizePermission("HR", "admin"), createEmployee)
	.get(getAllEmployees);

router.route("/employee/me").get(validateToken, getEmployeeByUserId);

router
	.route("/user/information/:userId")
	.get(validateToken, getUserInformation);

router.route("/employee/all").get(validateToken, getAllUserWithEmployeeRole);

router
	.route("/employee/:employeeId")
	.get(validateToken, getEmployee)
	.patch(
		validateToken,
		authorizePermission("HR", "admin", "project manager", "employee"),
		updateEmployee
	)
	.delete(validateToken, authorizePermission("HR", "admin"), deleteEmployee);

export default router;
