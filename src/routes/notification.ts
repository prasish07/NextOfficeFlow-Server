import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import {
	getNotificationUnreadCount,
	getNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.route("/notifications").get(validateToken, getNotifications);
router
	.route("/notifications/count")
	.get(validateToken, getNotificationUnreadCount);

export default router;
