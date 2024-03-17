import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import CalendarEvent from "../modals/calender";
import Notification from "../modals/notification";
import { createNotificationAll } from "../utils/notification.helper";
import { dateFormatter } from "../utils/helper";

export const createEvent = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { title, description, start, end, type } = req.body;
	try {
		const event = new CalendarEvent({
			title,
			description,
			start,
			end,
			type,
			createdBy: user.userId,
		});

		await event.save();

		// Create a notification for all the user about this event
		createNotificationAll({
			message: `New event created: <strong>${title}</strong> on ${dateFormatter(
				start
			)} to ${dateFormatter(end)}`,
			link: `/calendar`,
			type: "event",
		});

		return res.status(StatusCodes.CREATED).json({
			message: "Event created successfully",
			event,
		});
	} catch (error) {
		console.error("Error creating event:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			error: "Internal Server Error",
		});
	}
};

export const getEvents = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const events = await CalendarEvent.find({ createdBy: user.userId });

	if (!events) {
		throw new customAPIErrors("No events found", StatusCodes.NOT_FOUND);
	}

	return res.status(StatusCodes.OK).json({
		events,
	});
};

export const getEvent = async (req: Request, res: Response) => {
	const { eventId } = req.params;
	const event = await CalendarEvent.findById(eventId);

	if (!event) {
		throw new customAPIErrors(
			`Event with id ${eventId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	return res.status(StatusCodes.OK).json({
		event,
	});
};

export const updateEvent = async (req: Request, res: Response) => {
	const { eventId } = req.params;
	const updateEvent = await CalendarEvent.findByIdAndUpdate(eventId, {
		...req.body,
	});
	if (!updateEvent) {
		throw new customAPIErrors(
			`Event with id ${eventId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	// Create a notification for all the user about this event
	createNotificationAll({
		message: `Event updated: <strong>${updateEvent.title}</strong>`,
		link: `/calendar`,
		type: "event",
	});

	return res.status(StatusCodes.OK).json({
		message: "Event updated successfully",
		updateEvent,
	});
};

export const deleteEvent = async (req: Request, res: Response) => {
	const { eventId } = req.params;
	const event = await CalendarEvent.findByIdAndRemove(eventId);
	if (!event) {
		throw new customAPIErrors(
			`Event with id ${eventId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	// Create a notification for all the user about this event
	createNotificationAll({
		message: `Event deleted: <strong>${event.title}</strong>`,
		link: `/calendar`,
		type: "event",
	});

	return res.status(StatusCodes.OK).json({
		message: "Event deleted successfully",
	});
};

export const getAllEvents = async (req: Request, res: Response) => {
	const { start, end } = req.query;

	console.log(req.query);

	let filter: any = {};

	if (start && end) {
		filter.start = {
			$gte: new Date(start as string),
			$lte: new Date(end as string),
		};
	} else {
		const today = new Date();
		const startOfWeek = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate() - today.getDay()
		);
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const startOfYear = new Date(today.getFullYear(), 0, 1);

		if (start === "thisWeek") {
			filter.start = { $gte: startOfWeek, $lte: today };
		} else if (start === "thisMonth") {
			filter.start = { $gte: startOfMonth, $lte: today };
		} else if (start === "thisYear") {
			filter.start = { $gte: startOfYear, $lte: today };
		}
	}

	const events = await CalendarEvent.find(filter);

	res.status(StatusCodes.OK).json({
		events,
	});
};

export const getAllEventsUpcomingTwoMonths = async (
	req: Request,
	res: Response
) => {
	const today = new Date();
	const twoMonthsLater = new Date(
		today.getFullYear(),
		today.getMonth() + 2,
		today.getDate()
	);

	const filter = {
		start: {
			$gte: today,
			$lte: twoMonthsLater,
		},
	};

	try {
		const events = await CalendarEvent.find(filter);

		res.status(StatusCodes.OK).json({
			events,
		});
	} catch (error) {
		console.error("Error fetching events:", error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			error: "Internal Server Error",
		});
	}
};
