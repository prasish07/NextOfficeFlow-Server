import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Employee, { LeaveDetail } from "../modals/employee";

import Requests, {
	Leave,
	AttendanceRequest,
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
		if (user.role == "project manager") {
			request = new Requests({
				userId: user.userId,
				requestType,
				leaveId: leave._id,
				pmStatus: "approved",
			});
		} else {
			request = new Requests({
				userId: user.userId,
				requestType,
				leaveId: leave._id,
				requestedTo,
			});
		}
	}
	if (requestType === "allowance") {
		const { amount, reason } = req.body;
		const allowance = new Allowance({
			amount,
			reason,
			date: new Date(),
		});
		await allowance.save();
		request = new Requests({
			userId: user.userId,
			allowanceId: allowance._id,
			requestType,
		});
	}
	if (requestType === "overtime") {
		const { date, startTime, endTime, reason, requestedTo } = req.body;
		const overtime = new Overtime({
			date,
			startTime,
			endTime,
			reason,
		});
		await overtime.save();
		if (user.role == "project manager") {
			request = new Requests({
				userId: user.userId,
				overtimeId: overtime._id,
				requestType,
				pmStatus: "approved",
			});
		} else {
			request = new Requests({
				userId: user.userId,
				overtimeId: overtime._id,
				requestType,
				requestedTo,
			});
		}
	}

	if (requestType === "attendance") {
		const { date, reason } = req.body;
		const attendance = new AttendanceRequest({
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
			link: `/request/employee`,
			type: "request",
			userId: request?.requestedTo,
		});
	} else {
		createNotificationByRole({
			message: `You have a new request ${request.requestType} from ${requestedUser?.name}`,
			link: `/request/all`,
			type: "request",
			role: "admin",
		});

		createNotificationByRole({
			message: `You have a new ${request.requestType} request from ${requestedUser?.name}`,
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

	const { status, type, startDate, endDate, selectedType, searchEmployee } =
		req.query;

	// Build the filter criteria
	const filter: any = {};

	filter.userId = user.userId;

	if (status) {
		filter.status = status;
	}

	if (type) {
		filter.type = type;
	}

	if ((startDate && !endDate) || (endDate && !startDate)) {
		throw new customAPIErrors(
			"Please provide both startDate and endDate",
			StatusCodes.BAD_REQUEST
		);
	}

	const requests = await Requests.find(filter)
		.populate("leaveId")
		.populate("allowanceId")
		.populate("overtimeId")
		.populate("attendanceId")
		.sort({ createdAt: -1 });

	requests.forEach((request: any) => {
		if (request.requestType === "leave" && request.leaveId.type === "leave") {
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
	let requestsData = await Promise.all(
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

	if (searchEmployee) {
		requestsData = requestsData.filter((request) => {
			return request.employeeName
				.toLowerCase()
				.includes(searchEmployee as string);
		});
	}

	if (startDate && endDate) {
		if (selectedType === "leave") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "leave")
					return (
						new Date(request.leaveId.startDate) >=
							new Date(startDate as string) &&
						new Date(request.leaveId.startDate) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "overtime") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "overtime")
					return (
						new Date(request.overtimeId.date) >=
							new Date(startDate as string) &&
						new Date(request.overtimeId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "allowance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "allowance")
					return (
						new Date(request.allowanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.allowanceId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "attendance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "attendance")
					return (
						new Date(request.attendanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.attendanceId.date) <= new Date(endDate as string)
					);
			});
		}
	}

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
	const request: any = await Requests.findByIdAndUpdate(requestId, req.body)
		.populate("leaveId")
		.populate("allowanceId")
		.populate("overtimeId")
		.populate("attendanceId");
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
			message: `You have a new ${request.requestType} request`,
			role: "HR",
			link: `/request/all`,
			type: "request",
		});
	}

	if (req.body.status === "approved") {
		if (request.requestType === "leave" && request.leaveId.type === "leave") {
			const leaveDetails = await LeaveDetail.findOne({
				userId: request.userId,
				year: new Date(request.leaveId.startDate).getFullYear(),
			});
			const startDate = new Date(request.leaveId.startDate);
			const endDate = new Date(request.leaveId.endDate);

			const timeDifference = endDate.getTime() - startDate.getTime();

			let daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

			daysDifference = daysDifference + 1;

			if (leaveDetails) {
				for (let i = 1; i <= daysDifference; i++) {
					if (
						leaveDetails.totalPaidLeaveTaken >= leaveDetails.availableLeaves
					) {
						leaveDetails.totalUnpaidLeaveTaken =
							leaveDetails.totalUnpaidLeaveTaken + 1;
					} else {
						leaveDetails.totalPaidLeaveTaken =
							leaveDetails.totalPaidLeaveTaken + 1;
					}
					leaveDetails.leavesTaken = leaveDetails.leavesTaken + 1;
				}
				await leaveDetails.save();
			}
		}

		createNotification({
			message: `Your ${request.requestType} request has been approved`,
			link: `/request/my-request`,
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
	const request = await Requests.findById(requestId);

	if (!request) {
		throw new customAPIErrors(
			`Request with id ${requestId} not found`,
			StatusCodes.NOT_FOUND
		);
	}

	const user = await User.findById(request.userId);

	if (!user) {
		throw new customAPIErrors(`User not found`, StatusCodes.NOT_FOUND);
	}

	if (request.pmStatus !== "pending" && user.role !== "project manager") {
		throw new customAPIErrors(
			`Non pending request cannot be deleted`,
			StatusCodes.BAD_REQUEST
		);
	}

	if (request.status !== "pending") {
		throw new customAPIErrors(
			`Non pending request cannot be deleted`,
			StatusCodes.BAD_REQUEST
		);
	}

	const removeRequest = await Requests.findByIdAndDelete(requestId);

	return res.status(StatusCodes.OK).json({
		message: "Request deleted successfully",
	});
};

export const getAllRequests = async (req: Request, res: Response) => {
	// Extract filters from the query parameters
	const {
		startDate,
		endDate,
		searchEmployee,
		selectedType,
		status,
		type,
		shouldFilterPM = true,
	} = req.query;
	let leaveRequest = 0;
	let allowanceRequest = 0;
	let overtimeRequest = 0;
	let attendanceRequest = 0;

	const { userId, role } = (req as CustomerRequestInterface).user;

	// Build the filter criteria
	const filter: any = {};

	if ((startDate && !endDate) || (endDate && !startDate)) {
		throw new customAPIErrors(
			"Please provide both startDate and endDate",
			StatusCodes.BAD_REQUEST
		);
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

	let filteredRequests = requests;

	if (shouldFilterPM) {
		filteredRequests = requests.filter((request) => {
			if (
				(request.requestType === "leave" && request.pmStatus === "approved") ||
				(request.requestType === "overtime" &&
					request.pmStatus === "approved") ||
				request.requestType === "allowance" ||
				request.requestType === "attendance"
			) {
				return true;
			}
		});

		filteredRequests.forEach((request: any) => {
			if (request.requestType === "leave" && request.leaveId.type === "leave") {
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
	}

	// Fetch employee information for each request's userId
	let requestsData = await Promise.all(
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

	if (searchEmployee) {
		requestsData = requestsData.filter((request) => {
			return request.employeeName
				.toLowerCase()
				.includes(searchEmployee as string);
		});
	}

	if (startDate && endDate) {
		if (selectedType === "leave") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "leave")
					return (
						new Date(request.leaveId.startDate) >=
							new Date(startDate as string) &&
						new Date(request.leaveId.startDate) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "overtime") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "overtime")
					return (
						new Date(request.overtimeId.date) >=
							new Date(startDate as string) &&
						new Date(request.overtimeId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "allowance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "allowance")
					return (
						new Date(request.allowanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.allowanceId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "attendance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "attendance")
					return (
						new Date(request.attendanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.attendanceId.date) <= new Date(endDate as string)
					);
			});
		}
	}

	return res.status(StatusCodes.OK).json({
		requests: requestsData,
		leaveRequest,
		allowanceRequest,
		overtimeRequest,
		attendanceRequest,
	});
};

export const getPMRequestedRequest = async (req: Request, res: Response) => {
	// Extract query
	const { startDate, endDate, selectedType, searchEmployee } = req.query;
	const { status, type } = req.query;

	// Extract filters from the query parameters
	const user = (req as CustomerRequestInterface).user;

	let leaveRequest = 0;
	let overtimeRequest = 0;

	// Build the filter criteria
	const filter: any = {};

	filter.requestedTo = user.userId;

	if ((startDate && !endDate) || (endDate && !startDate)) {
		throw new customAPIErrors(
			"Please provide both startDate and endDate",
			StatusCodes.BAD_REQUEST
		);
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
		.populate("overtimeId")
		.sort({ createdAt: -1 });

	requests.forEach((request: any) => {
		if (request.requestType === "leave" && request.leaveId.type === "leave") {
			leaveRequest++;
		}
		if (request.requestType === "overtime") {
			overtimeRequest++;
		}
	});

	// Fetch employee information for each request's userId
	let requestsData: any = await Promise.all(
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

	if (searchEmployee) {
		requestsData = requestsData.filter((request: any) => {
			return request.employeeName
				.toLowerCase()
				.includes(searchEmployee as string);
		});
	}

	if (startDate && endDate) {
		if (selectedType === "leave") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "leave")
					return (
						new Date(request.leaveId.startDate) >=
							new Date(startDate as string) &&
						new Date(request.leaveId.startDate) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "overtime") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "overtime")
					return (
						new Date(request.overtimeId.date) >=
							new Date(startDate as string) &&
						new Date(request.overtimeId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "allowance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "allowance")
					return (
						new Date(request.allowanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.allowanceId.date) <= new Date(endDate as string)
					);
			});
		} else if (selectedType === "attendance") {
			requestsData = requestsData.filter((request: any) => {
				if (request.requestType === "attendance")
					return (
						new Date(request.attendanceId.date) >=
							new Date(startDate as string) &&
						new Date(request.attendanceId.date) <= new Date(endDate as string)
					);
			});
		}
	}

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
