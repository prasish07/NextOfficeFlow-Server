import { Router, Request, Response } from "express";

import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

const router = Router();

import {
	createEvent,
	deleteEvent,
	getAllEvents,
	getEvent,
	getEvents,
	updateEvent,
} from "../controllers/calender.controller";

router
	.route("/event")
	.post(validateToken, authorizePermission("admin", "HR"), createEvent)
	.get(validateToken, authorizePermission("admin", "HR"), getEvents);

router
	.route("/event/:eventId")
	.get(validateToken, getEvent)
	.patch(validateToken, authorizePermission("admin", "HR"), updateEvent)
	.delete(validateToken, authorizePermission("admin", "HR"), deleteEvent);

router.route("/events").get(validateToken, getAllEvents);

export default router;
