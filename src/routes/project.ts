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
} from "../controllers/project.controller";

import { getProjectTickets } from "../controllers/ticket.controller";

const router = Router();

router
	.route("/project")
	.post(validateToken, authorizePermission("employee", "admin"), createProject)
	.get(getAllProject);

router
	.route("/project/counts")
	.get(
		validateToken,
		authorizePermission("employee", "admin"),
		getProjectStatusCount
	);
router
	.route("/project/:projectId")
	.get(validateToken, authorizePermission("employee", "admin"), getProject)
	.patch(validateToken, authorizePermission("employee", "admin"), updateProject)
	.delete(
		validateToken,
		authorizePermission("employee", "admin"),
		deleteProject
	);

router
	.route("/project/:projectId/tickets")
	.get(
		validateToken,
		authorizePermission("employee", "admin"),
		getProjectTickets
	);

export default router;
