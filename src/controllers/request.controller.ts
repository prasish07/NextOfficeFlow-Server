import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import mongoose from "mongoose";
import Requests from "../modals/request";

export const createRequest = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { type, details } = req.body;
	const request = new Requests({
		userId: user.userId,
		type,
		details,
	});

	await request.save();

	return res.status(StatusCodes.CREATED).json({
		message: "Request created successfully",
		request,
	});
};

export const getRequests = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const requests = await Requests.find({ userId: user.userId });

	if (!requests) {
		throw new customAPIErrors("No requests found", StatusCodes.NOT_FOUND);
	}

	return res.status(StatusCodes.OK).json({
		requests,
	});
};

export const getRequest = async (req: Request, res: Response) => {
	const { requestId } = req.params;
	const request = await Requests.findById(requestId);

	if (!request) {
		throw new customAPIErrors(
			`Request with id ${requestId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	return res.status(StatusCodes.OK).json({
		request,
	});
};

export const updateRequest = async (req: Request, res: Response) => {
	const { requestId } = req.params;
	const { status } = req.body;
	const request = await Requests.findById(requestId);
	if (!request) {
		throw new customAPIErrors(
			`Request with id ${requestId} not found`,
			StatusCodes.NOT_FOUND
		);
	}
	request.status = status;
	await request.save();
	return res.status(StatusCodes.OK).json({
		message: "Request updated successfully",
		request,
	});
};

export const deleteRequest = async (req: Request, res: Response) => {
	const { requestId } = req.params;
	const request = await Requests.findByIdAndRemove(requestId);
	if (!request) {
		throw new customAPIErrors(
			`Request with id ${requestId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	return res.status(StatusCodes.OK).json({
		message: "Request deleted successfully",
	});
};

export const getAllRequests = async (req: Request, res: Response) => {
	// Extract filters from the query parameters
	const { date, status, type } = req.query;

	// Build the filter criteria
	const filter: any = {};

	if (date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (date === "today") {
			filter.date = today;
		} else if (date === "yesterday") {
			const yesterday = new Date(today);
			yesterday.setDate(today.getDate() - 1);
			filter.date = yesterday;
		} else if (date === "thisWeek") {
			const firstDayOfWeek = new Date(today);
			firstDayOfWeek.setDate(today.getDate() - today.getDay());
			filter.date = { $gte: firstDayOfWeek, $lt: today };
		} else if (date === "thisMonth") {
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1
			);
			filter.date = { $gte: firstDayOfMonth, $lt: today };
		} else {
			// Assume custom date is in ISO format (YYYY-MM-DD)
			filter.date = new Date(date as string);
		}
	}

	if (status) {
		// Example: filter by status
		filter.status = status;
	}

	if (type) {
		// Example: filter by type
		filter.type = type;
	}

	// Use the filter criteria to fetch requests
	const requests = await Requests.find(filter);

	if (!requests || requests.length === 0) {
		throw new customAPIErrors("No requests found", StatusCodes.NOT_FOUND);
	}

	return res.status(StatusCodes.OK).json({
		requests,
	});
};
