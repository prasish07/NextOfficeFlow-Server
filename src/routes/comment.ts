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
	.post(validateToken, authorizePermission("employee", "admin"), createComment);

router
	.route("/project/:projectId/comments")
	.get(
		validateToken,
		authorizePermission("employee", "admin"),
		getProjectComment
	);
router
	.route("/comment/ticket")
	.get(
		validateToken,
		authorizePermission("employee", "admin"),
		getTicketComment
	);

router
	.route("/comment/:commentId")
	.delete(validateToken, authorizePermission("HR", "admin"), deleteComment);

export default router;
