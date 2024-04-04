import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Employee from "../modals/employee";

import Requests, {
	Leave,
	Attendance,
	Allowance,
	Overtime,
} from "../modals/request";
import {
	createNotification,
	createNotificationByRole,
} from "../utils/notification.helper";

export const createRequest = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { requestType } = req.body;
	let request;

	if (requestType === "leave") {
		const { startDate, endDate, reason, type, requestedTo } = req.body;
		const leave = new Leave({
			type,
			startDate,
			endDate,
			reason,
		});
		await leave.save();
		request = new Requests({
			userId: user.userId,
			requestType,
			leaveId: leave._id,
			requestedTo,
		});
	}
	if (requestType === "allowance") {
		const { amount, reason } = req.body;
		const allowance = new Allowance({
			amount,
			reason,
		});
		await allowance.save();
		request = new Requests({
			userId: user.userId,
			allowanceId: allowance._id,
			requestType,
		});
	}
	if (requestType === "overtime") {
		const { date, startTime, endTime, reason } = req.body;
		const overtime = new Overtime({
			date,
			startTime,
			endTime,
			reason,
		});
		await overtime.save();
		request = new Requests({
			userId: user.userId,
			overtimeId: overtime._id,
			requestType,
		});
	}
	if (requestType === "attendance") {
		const { date, reason } = req.body;
		const attendance = new Attendance({
			date,
			reason,
		});
		await attendance.save();
		request = new Requests({
			userId: user.userId,
			attendanceId: attendance._id,
			requestType,
		});
	}
	if (!request) {
		throw new customAPIErrors("Invalid request type", StatusCodes.BAD_REQUEST);
	}
	await request.save();

	// Sent notification about the request to the requestedTo user
	const requestedUser = await Employee.findOne({
		userId: user.userId,
	});

	if (req.body.requestedTo) {
		createNotification({
			message: `You have a new request from ${requestedUser?.name}`,
			link: `/requests`,
			type: "request",
			userId: request?.requestedTo,
		});
	} else {
		createNotification({
			message: `You have a new request from ${requestedUser?.name}`,
			link: `/request/all`,
			type: "request",
			role: "admin",
		});

		createNotification({
			message: `You have a new request from ${requestedUser?.name}`,
			link: `/request/all`,
			type: "request",
			role: "HR",
		});
	}

	return res.status(StatusCodes.CREATED).json({
		message: "Request created successfully",
		request,
	});
};

export const getRequests = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;

	let leaveRequest = 0;
	let allowanceRequest = 0;
	let overtimeRequest = 0;
	let attendanceRequest = 0;

	const { date, status, type } = req.query;

	// Build the filter criteria
	const filter: any = {};

	filter.userId = user.userId;

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
			filter.date = new Date(date as string);
		}
	}

	if (status) {
		filter.status = status;
	}

	if (type) {
		filter.type = type;
	}

	const requests = await Requests.find(filter)
		.populate("leaveId")
		.populate("allowanceId")
		.populate("overtimeId")
		.populate("attendanceId")
		.sort({ createdAt: -1 });

	requests.forEach((request) => {
		if (request.requestType === "leave") {
			leaveRequest++;
		}
		if (request.requestType === "allowance") {
			allowanceRequest++;
		}
		if (request.requestType === "overtime") {
			overtimeRequest++;
		}
		if (request.requestType === "attendance") {
			attendanceRequest++;
		}
	});

	// Fetch employee information for each request's userId
	const requestsData = await Promise.all(
		requests.map(async (request) => {
			const employee = await Employee.findOne({ userId: request.userId });

			// Modify the request object to include employee information
			const modifiedRequest = {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...request.toJSON(),
			};

			return modifiedRequest;
		})
	);

	return res.status(StatusCodes.OK).json({
		requests: requestsData,
		leaveRequest,
		allowanceRequest,
		overtimeRequest,
		attendanceRequest,
	});
};

export const getRequest = async (req: Request, res: Response) => {
	const { requestId } = req.params;
	const request = await Requests.findById(requestId)
		.populate("leaveId")
		.populate("allowanceId")
		.populate("overtimeId")
		.populate("attendanceId")
		.populate("requestedTo");

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
	const request = await Requests.findByIdAndUpdate(requestId, req.body);
	if (!request) {
		throw new customAPIErrors(
			`Request with id ${requestId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	if (
		request.requestedTo &&
		request.pmStatus === "approved" &&
		request.status === "pending"
	) {
		createNotificationByRole({
			message: `You have a new request`,
			role: "HR",
			link: `/requests`,
			type: "request",
		});
	}

	if (req.body.status === "approved") {
		createNotification({
			message: `Your request has been approved`,
			link: `/requests`,
			type: "request",
			userId: request.userId,
		});
	}

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
	let leaveRequest = 0;
	let allowanceRequest = 0;
	let overtimeRequest = 0;
	let attendanceRequest = 0;

	const { userId, role } = (req as CustomerRequestInterface).user;

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
			filter.date = new Date(date as string);
		}
	}

	if (status) {
		filter.status = status;
	}

	if (type) {
		filter.type = type;
	}

	// Use the filter criteria to fetch requests
	const requests = await Requests.find(filter)
		.populate("leaveId")
		.populate("allowanceId")
		.populate("overtimeId")
		.populate("attendanceId")
		.sort({ createdAt: -1 });

	const filteredRequests = requests.filter((request) => {
		if (
			(request.requestType === "leave" && request.pmStatus === "approved") ||
			(request.requestType === "overtime" && request.pmStatus === "approved") ||
			request.requestType === "allowance" ||
			request.requestType === "attendance"
		) {
			return true;
		}
	});

	filteredRequests.forEach((request) => {
		if (request.requestType === "leave") {
			leaveRequest++;
		}
		if (request.requestType === "allowance") {
			allowanceRequest++;
		}
		if (request.requestType === "overtime") {
			overtimeRequest++;
		}
		if (request.requestType === "attendance") {
			attendanceRequest++;
		}
	});

	// Fetch employee information for each request's userId
	const requestsData = await Promise.all(
		filteredRequests.map(async (request) => {
			const employee = await Employee.findOne({ userId: request.userId });

			// Modify the request object to include employee information
			const modifiedRequest = {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...request.toJSON(),
			};

			return modifiedRequest;
		})
	);

	return res.status(StatusCodes.OK).json({
		requests: requestsData,
		leaveRequest,
		allowanceRequest,
		overtimeRequest,
		attendanceRequest,
	});
};

export const getPMRequestedRequest = async (req: Request, res: Response) => {
	// Extract filters from the query parameters
	const user = (req as CustomerRequestInterface).user;

	const { date, status, type } = req.query;
	let leaveRequest = 0;
	let overtimeRequest = 0;

	// Build the filter criteria
	const filter: any = {};
	filter.requestedTo = user.userId;

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
			filter.date = new Date(date as string);
		}
	}

	if (status) {
		filter.status = status;
	}

	if (type) {
		filter.type = type;
	}

	// Use the filter criteria to fetch requests
	const requests = await Requests.find()
		.populate("leaveId")
		.populate("overtimeId")
		.sort({ createdAt: -1 });

	requests.forEach((request) => {
		if (request.requestType === "leave") {
			leaveRequest++;
		}
		if (request.requestType === "overtime") {
			overtimeRequest++;
		}
	});

	// Fetch employee information for each request's userId
	const requestsData = await Promise.all(
		requests.map(async (request) => {
			const employee = await Employee.findOne({ userId: request.userId });

			// Modify the request object to include employee information
			const modifiedRequest = {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...request.toJSON(),
			};

			return modifiedRequest;
		})
	);

	return res.status(StatusCodes.OK).json({
		requests: requestsData,
		leaveRequest,
		overtimeRequest,
	});
};

export const getUserRequestCount = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	let leaveRequest = 0;
	let allowanceRequest = 0;
	let overtimeRequest = 0;
	let attendanceRequest = 0;

	const { countType } = req.params;
	const { date, status, type } = req.query;

	// Build the filter criteria
	const filter: any = {};

	if (countType == "user") {
		filter.userId = user.userId;
	}

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
			filter.date = new Date(date as string);
		}
	}

	if (status) {
		filter.status = status;
	}

	if (type) {
		filter.type = type;
	}

	const requests = await Requests.find(filter);

	requests.forEach((request) => {
		if (request.requestType === "leave") {
			leaveRequest++;
		}
		if (request.requestType === "allowance") {
			allowanceRequest++;
		}
		if (request.requestType === "overtime") {
			overtimeRequest++;
		}
		if (request.requestType === "attendance") {
			attendanceRequest++;
		}
	});

	return res.json({
		data: requests,
		leaveRequest,
		allowanceRequest,
		overtimeRequest,
		attendanceRequest,
	});
};
