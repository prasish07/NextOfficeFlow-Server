import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import { getNotifications } from "../controllers/notification.controller";

const router = Router();

router.route("/notifications").get(validateToken, getNotifications);

export default router;
