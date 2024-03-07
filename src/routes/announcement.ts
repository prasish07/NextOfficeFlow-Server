import { Router } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

import {
	createAnnouncement,
	deleteAnnouncement,
	getAllAnnouncements,
	getAnnouncement,
	updateAnnouncement,
} from "../controllers/announcement";

const router = Router();

router
	.route("/announcement")
	.post(validateToken, authorizePermission("admin", "HR"), createAnnouncement)
	.get(validateToken, getAllAnnouncements);

router
	.route("/announcement/:announcementId")
	.get(validateToken, getAnnouncement)
	.put(validateToken, authorizePermission("admin", "HR"), updateAnnouncement)
	.delete(
		validateToken,
		authorizePermission("admin", "HR"),
		deleteAnnouncement
	);

export default router;
