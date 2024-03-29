import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import {
	createProject,
	updateProject,
	deleteProject,
	getAllProject,
	getProject,
	getProjectStatusCount,
	addAssigneeToProject,
	addAttachmentToProject,
	linkGitHub,
	CreateAndLinkGitHub,
} from "../controllers/project.controller";

import { getProjectTickets } from "../controllers/ticket.controller";

const router = Router();

router
	.route("/project")
	.post(
		validateToken,
		authorizePermission("project manager", "admin"),
		createProject
	)
	.get(
		validateToken,
		authorizePermission("project manager", "admin", "employee"),
		getAllProject
	);

router
	.route("/project/counts")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getProjectStatusCount
	);

router
	.route("/project/:projectId/github")
	.patch(
		validateToken,
		authorizePermission("project manager", "admin"),
		linkGitHub
	);

router
	.route("/project/:projectId/github")
	.put(
		validateToken,
		authorizePermission("project manager", "admin"),
		CreateAndLinkGitHub
	);

router
	.route("/project/:projectId/addAssignee")
	.post(
		validateToken,
		authorizePermission("project manager", "admin"),
		addAssigneeToProject
	);

router
	.route("/project/:projectId")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getProject
	)
	.patch(
		validateToken,
		authorizePermission("project manager", "admin"),
		updateProject
	)
	.delete(
		validateToken,
		authorizePermission("project manager", "admin"),
		deleteProject
	);

router
	.route("/project/:projectId/tickets")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getProjectTickets
	);

router
	.route("/project/attachment")
	.post(
		validateToken,
		authorizePermission("employee", "project manager", "admin"),
		addAttachmentToProject
	);

export default router;
