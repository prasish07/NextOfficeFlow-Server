import { Router, Request, Response } from "express";

import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

const router = Router();

import {
	checkIn,
	checkOut,
	getAllTimeAttendance,
	manualAttendance,
	getAttendanceByUserId,
	getAttendanceByUserIdAndToday,
	getTodayTotalAttendance,
	getTodayUnCheckedEmployees,
	getSingleAttendance,
} from "../controllers/attendance.controller";

router
	.route("/attendance/checkin")
	.post(
		validateToken,
		authorizePermission("employee", "project manager"),
		checkIn
	);
router
	.route("/attendance/checkout")
	.post(
		validateToken,
		authorizePermission("employee", "project manager"),
		checkOut
	);
router
	.route("/attendance/all")
	.get(validateToken, authorizePermission("HR", "admin"), getAllTimeAttendance);
router
	.route("/attendance/manual")
	.post(validateToken, authorizePermission("HR", "admin"), manualAttendance);

router
	.route("/attendance/me/today")
	.get(validateToken, getAttendanceByUserIdAndToday);

router
	.route("/attendance/employee/:userId?")
	.get(validateToken, getAttendanceByUserId);

router
	.route("/attendance/today/total")
	.get(validateToken, getTodayTotalAttendance);

router
	.route("/attendance/today/uncheck")
	.get(validateToken, getTodayUnCheckedEmployees);

router
	.route("/attendance/:id")
	.get(validateToken, authorizePermission("HR", "admin"), getSingleAttendance);

export default router;
