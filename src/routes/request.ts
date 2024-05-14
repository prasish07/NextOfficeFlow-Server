import { Router, Request, Response } from "express";

import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

const router = Router();

import {
	createRequest,
	deleteRequest,
	getAllRequests,
	getRequest,
	getRequests,
	updateRequest,
	getUserRequestCount,
	getPMRequestedRequest,
} from "../controllers/request.controller";

router
	.route("/request")
	.post(validateToken, createRequest)
	.get(validateToken, getRequests);

router
	.route("/request/count")
	.get(validateToken, authorizePermission("admin", "HR"), getUserRequestCount);

router
	.route("/request/pm/request")
	.get(
		validateToken,
		authorizePermission("project manager"),
		getPMRequestedRequest
	);

router
	.route("/request/count/:countType")
	.get(validateToken, getUserRequestCount);

router
	.route("/request/:requestId")
	.get(validateToken, getRequest)
	.patch(
		validateToken,
		authorizePermission("admin", "HR", "project manager"),
		updateRequest
	)
	.delete(validateToken, deleteRequest);

router
	.route("/requests")
	.get(
		validateToken,
		authorizePermission("admin", "HR", "project manager"),
		getAllRequests
	);

export default router;
