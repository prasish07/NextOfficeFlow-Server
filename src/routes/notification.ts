import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import {
	getNotificationUnreadCount,
	getNotifications,
	markAllAsRead,
	updateSeen,
} from "../controllers/notification.controller";

const router = Router();

router.route("/notifications").get(validateToken, getNotifications);
router
	.route("/notifications/count")
	.get(validateToken, getNotificationUnreadCount);

router.route("/notifications/all").patch(validateToken, markAllAsRead);

router.route("/notifications/:notificationId").patch(validateToken, updateSeen);

export default router;
