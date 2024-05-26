import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import {
	createComment,
	deleteComment,
	getProjectComment,
	getTicketComment,
} from "../controllers/comment.controller";

const router = Router();

router
	.route("/comment")
	.post(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		createComment
	);

router
	.route("/project/:projectId/comments")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getProjectComment
	);
router
	.route("/comment/ticket")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getTicketComment
	);

router
	.route("/comment/:commentId")
	.delete(
		validateToken,
		authorizePermission("HR", "admin", "project manager"),
		deleteComment
	);

export default router;
