import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import {
	feedback,
	getAllAppraisalHistory,
	getAppraisal,
	getEmployeeMeasures,
	getMyAppraisalHistory,
	increaseSalary,
	promote,
} from "../controllers/appraisal.controller";

const router = Router();

router
	.route("/appraisal/measures")
	.get(validateToken, authorizePermission("admin"), getEmployeeMeasures);
router
	.route("/appraisal/promote/:userId")
	.post(validateToken, authorizePermission("admin"), promote);
router
	.route("/appraisal/increase-salary/:userId")
	.post(validateToken, authorizePermission("admin"), increaseSalary);
router
	.route("/appraisal/feedback/:userId")
	.post(validateToken, authorizePermission("admin"), feedback);
router
	.route("/appraisal/history/all")
	.get(validateToken, authorizePermission("admin"), getAllAppraisalHistory);
router.route("/appraisal/history/my").get(validateToken, getMyAppraisalHistory);
router.route("/appraisal/:appraisalId").get(validateToken, getAppraisal);

export default router;
