import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import CalendarEvent from "../modals/calender";

export const createEvent = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { title, description, startDate, endDate, type } = req.body;
	const event = new CalendarEvent({
		title,
		description,
		startDate,
		endDate,
		type,
		createdBy: user.userId,
	});

	await event.save();

	return res.status(StatusCodes.CREATED).json({
		message: "Event created successfully",
		event,
	});
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
	return res.status(StatusCodes.OK).json({
		message: "Event deleted successfully",
	});
};

export const getAllEvents = async (req: Request, res: Response) => {
	const { startDate, endDate } = req.query;

	let filter: any = {};

	if (startDate && endDate) {
		filter.startDate = {
			$gte: new Date(startDate as string),
			$lte: new Date(endDate as string),
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

		if (startDate === "thisWeek") {
			filter.startDate = { $gte: startOfWeek, $lte: today };
		} else if (startDate === "thisMonth") {
			filter.startDate = { $gte: startOfMonth, $lte: today };
		} else if (startDate === "thisYear") {
			filter.startDate = { $gte: startOfYear, $lte: today };
		}
	}

	const events = await CalendarEvent.find(filter);

	if (!events || events.length === 0) {
		throw new customAPIErrors("No events found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		events,
	});
};
