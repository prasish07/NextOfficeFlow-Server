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
	.post(validateToken, authorizePermission("employee", "admin"), createTicket)
	.get(getTickets);

router
	.route("/ticket/:ticketId")
	.get(validateToken, authorizePermission("employee", "admin"), getOneTicket)
	.patch(validateToken, authorizePermission("employee", "admin"), updateTicket)
	.delete(
		validateToken,
		authorizePermission("employee", "admin"),
		deleteTicket
	);

export default router;
