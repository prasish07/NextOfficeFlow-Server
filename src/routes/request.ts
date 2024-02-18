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
} from "../controllers/request.controller";

router
	.route("/request")
	.post(validateToken, createRequest)
	.get(validateToken, authorizePermission("admin", "HR"), getRequests);

router
	.route("/request/:requestId")
	.get(validateToken, getRequest)
	.patch(validateToken, authorizePermission("admin", "HR"), updateRequest)
	.delete(validateToken, authorizePermission("admin", "HR"), deleteRequest);

router
	.route("/requests")
	.get(validateToken, authorizePermission("admin", "HR"), getAllRequests);

export default router;
