import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import { getEmployeeProjectAndTicketMeasures } from "../controllers/appraisal";
const router = Router();

router
	.route("/appraisal/measures")
	.get(validateToken, getEmployeeProjectAndTicketMeasures);
export default router;
