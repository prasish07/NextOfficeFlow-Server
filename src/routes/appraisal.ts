import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import { getEmployeeMeasures } from "../controllers/appraisal.controller";
const router = Router();

router.route("/appraisal/measures").get(validateToken, getEmployeeMeasures);
export default router;
