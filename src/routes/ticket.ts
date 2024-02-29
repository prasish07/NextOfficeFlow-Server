import { Router, Request, Response } from "express";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";
import {
	createTicket,
	updateTicket,
	deleteTicket,
	getOneTicket,
	getTickets,
} from "../controllers/ticket.controller";

const router = Router();

router
	.route("/ticket")
	.post(
		validateToken,
		authorizePermission("project manager", "admin"),
		createTicket
	)
	.get(
		validateToken,
		authorizePermission("project manager", "admin", "employee"),
		getTickets
	);

router
	.route("/ticket/:ticketId")
	.get(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		getOneTicket
	)
	.patch(
		validateToken,
		authorizePermission("employee", "admin", "project manager"),
		updateTicket
	)
	.delete(
		validateToken,
		authorizePermission("project manager", "admin"),
		deleteTicket
	);

export default router;
