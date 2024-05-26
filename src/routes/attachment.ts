import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import {
	createAttachment,
	deleteAttachment,
	getProjectAttachment,
	getTicketAttachment,
} from "../controllers/attachment.controller";

const router = Router();

router
	.route("/attachment")
	.post(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		createAttachment
	);

router
	.route("/project/:projectId/attachment")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getProjectAttachment
	);
router
	.route("/ticket/:ticket/attachment")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getTicketAttachment
	);

router
	.route("/attachment/:attachmentId")
	.delete(validateToken, authorizePermission("HR", "admin"), deleteAttachment);

export default router;
