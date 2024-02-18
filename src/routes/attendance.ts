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
} from "../controllers/attendance.controller";

router
	.route("/attendance/checkin")
	.post(validateToken, authorizePermission("employee"), checkIn);
router
	.route("/attendance/checkout")
	.post(validateToken, authorizePermission("employee"), checkOut);
router
	.route("/attendance/all")
	.get(validateToken, authorizePermission("HR", "admin"), getAllTimeAttendance);
router
	.route("/attendance/manual")
	.post(validateToken, authorizePermission("HR", "admin"), manualAttendance);

router
	.route("/attendance/me/today")
	.get(validateToken, getAttendanceByUserIdAndToday);

router.route("/attendance/:userId").get(validateToken, getAttendanceByUserId);

export default router;
