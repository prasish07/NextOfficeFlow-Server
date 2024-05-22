import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project from "../modals/project";
import Ticket from "../modals/ticket";
import Employee from "../modals/employee";
import User from "../modals/user";
import Attendance from "../modals/attendance";
import { LeaveDetail } from "../modals/employee";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import Appraisal from "../modals/appraisal";
import { createNotification } from "../utils/notification.helper";

export const getEmployeeMeasures = async (req: Request, res: Response) => {
	let { userId, type, year } = req.query;

	let filter: any = {};

	if (type === "project") {
		let totalProject = 0;
		let completedProject = 0;
		let overdueProject = 0;
		let cancelledProject = 0;
		let totalTicketInProject = 0;
		let completedTicketInProject = 0;
		let overdueTicketInProject = 0;
		let cancelledTicketInProject = 0;

		const projectCount = await Project.find({
			assigneeId: userId,
		});

		let ticketList: any = [];

		await Promise.all(
			projectCount.map(async (project: any) => {
				totalProject++;
				if (project.status === "completed") {
					completedProject++;
				}
				if (
					project.endDate < new Date() &&
					project.status !== "completed" &&
					project.status !== "cancelled"
				) {
					overdueProject++;
				}
				if (project.status === "cancelled") {
					cancelledProject++;
				}
				const ticketCount = await Ticket.find({
					linkedProject: project._id,
					assigneeId: userId,
				});

				totalTicketInProject = ticketCount.length;
				await Promise.all(
					ticketCount.map((ticket) => {
						if (ticket.status === "completed") {
							completedTicketInProject++;
						}
						if (
							ticket.dueDate < new Date() &&
							ticket.status !== "completed" &&
							ticket.status !== "cancelled"
						) {
							overdueTicketInProject++;
						}
						if (ticket.status === "cancelled") {
							cancelledTicketInProject++;
						}
					})
				);
				ticketList.push({
					projectId: project._id,
					projectName: project.title,
					ticketCount: ticketCount.length,
					completedTicketInProject,
					overdueTicketInProject,
					cancelledTicketInProject,
				});

				// Reset the variables for
				completedTicketInProject = 0;
				overdueTicketInProject = 0;
				cancelledTicketInProject = 0;
			})
		);

		res.status(StatusCodes.OK).json({
			totalProject,
			completedProject,
			overdueProject,
			cancelledProject,
			ticketList: ticketList,
		});
	}

	if (type === "ticket") {
		let totalTicket = 0;
		let completedTicket = 0;
		let overdueTicket = 0;
		let cancelledTicket = 0;

		const ticketCount = await Ticket.find({
			assigneeId: userId,
		});
		totalTicket = ticketCount.length;
		await Promise.all(
			ticketCount.map((ticket) => {
				totalTicket++;
				if (ticket.status === "completed") {
					completedTicket++;
				}
				if (
					ticket.dueDate < new Date() &&
					ticket.status !== "completed" &&
					ticket.status !== "cancelled"
				) {
					overdueTicket++;
				}
				if (ticket.status === "cancelled") {
					cancelledTicket++;
				}
			})
		);
		return res.status(StatusCodes.OK).json({
			totalTicket,
			completedTicket,
			overdueTicket,
			cancelledTicket,
		});
	}

	if (type === "leave") {
		const leaveDetails = await LeaveDetail.findOne({
			userId,
			year: year ? year : new Date().getFullYear(),
		}).populate("userId");

		if (!leaveDetails) {
			new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
		}
		res.status(StatusCodes.OK).json({
			leaveDetails,
		});
	}

	if (type === "attendance") {
		const currentDate = new Date();
		const currentYear = currentDate.getFullYear();

		if (year) {
			filter = {
				userId,
				date: {
					$gte: new Date(+year, 0, 1),
					$lt: new Date(+year + 1, 0, 1),
				},
			};
		} else {
			filter = {
				userId,
				date: {
					$gte: new Date(currentYear, 0, 1),
					$lt: currentDate,
				},
			};
		}
		const attendanceDetails = await Attendance.find(filter);

		// Function to calculates the total days for a given status
		const calculateTotalDaysWithStatus = (status: string, month: number) => {
			return attendanceDetails.filter((entry) => {
				return (
					entry.status === status && new Date(entry.date).getMonth() === month
				);
			}).length;
		};

		// Function to calculates the total days for a given type
		const calculateTotalDaysWithType = (type: string, month: number) => {
			return attendanceDetails.filter(
				(entry) =>
					entry.type === type && new Date(entry.date).getMonth() === month
			).length;
		};

		const calculateTotalLateDays = (month: number) => {
			return attendanceDetails.filter(
				(entry) =>
					entry.checkInStatus === "late" &&
					new Date(entry.date).getMonth() === month
			).length;
		};

		let result = [];
		let month = 0;

		if (year) {
			month = 12;
		} else {
			month = currentDate.getMonth();
		}

		for (let i = 0; i <= month - 1; i++) {
			let present = calculateTotalDaysWithStatus("present", i);
			let absent = calculateTotalDaysWithStatus("absent", i);
			let remote = calculateTotalDaysWithType("remote", i);
			let onsite = calculateTotalDaysWithType("onsite", i);
			let late = calculateTotalLateDays(i);
			let total = present + absent;

			result.push({
				month: i,
				present,
				absent,
				remote,
				onsite,
				total,
				late,
				monthAttendance: new Date(2000, i, 1).toLocaleString("en-US", {
					month: "long",
				}),
			});
			let monthAttendance = i + 1;
		}

		res.status(StatusCodes.OK).json({
			attendanceDetails: result,
		});
	}
};

export const promote = async (req: Request, res: Response) => {
	const { userId } = req.params;

	const { newPosition, newSalary, feedback, pastPosition, pastSalary } =
		req.body;

	const employee = await Employee.findOne({ userId });

	if (!employee) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	employee.position = newPosition;
	employee.salary = newSalary;

	await employee.save();

	const newAppraisal = new Appraisal({
		date: new Date(),
		userId,
		type: "promotion",
		feedback,
		newPosition,
		newSalary,
		pastPosition,
		pastSalary,
	});

	await newAppraisal.save();

	createNotification({
		message: `You have been promoted to ${newPosition}`,
		userId,
		type: "employee",
		link: `/appraisal/history`,
	});

	res.status(StatusCodes.OK).json({
		message: "Employee promoted successfully",
	});
};

export const increaseSalary = async (req: Request, res: Response) => {
	const { userId } = req.params;

	const { newSalary, feedback, pastSalary } = req.body;

	const employee = await Employee.findOne({ userId });

	if (!employee) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	employee.salary = newSalary;

	await employee.save();

	const newAppraisal = new Appraisal({
		date: new Date(),
		userId,
		type: "salary increase",
		feedback,
		newSalary,
		pastSalary,
	});

	await newAppraisal.save();

	createNotification({
		message: `Your salary has been increased to ${newSalary}`,
		userId,
		type: "employee",
		link: `/appraisal/history`,
	});

	res.status(StatusCodes.OK).json({
		message: "Salary increased successfully",
	});
};

export const feedback = async (req: Request, res: Response) => {
	const { userId } = req.params;

	const { feedback } = req.body;

	const newAppraisal = new Appraisal({
		date: new Date(),
		userId,
		type: "feedback",
		feedback,
	});

	await newAppraisal.save();

	createNotification({
		message: `You have a new feedback`,
		userId,
		type: "employee",
		link: `/appraisal/history`,
	});

	res.status(StatusCodes.OK).json({
		message: "Feedback added successfully",
	});
};

export const getAllAppraisalHistory = async (req: Request, res: Response) => {
	let { userId, year } = req.query;
	let filter: any = {};

	// if (!userId) return [];

	if (userId) {
		filter.userId = userId;
	}

	if (year) {
		filter.date = {
			$gte: new Date(+year, 0, 1),
			$lt: new Date(+year + 1, 0, 1),
		};
	}

	const appraisal = await Appraisal.find(filter).sort({ date: -1 });

	if (!appraisal) {
		return [];
	}

	const appraisalHistory = await Promise.all(
		appraisal.map(async (element) => {
			const user = await Employee.findOne({ userId: element.userId });

			const data = {
				employeeName: user?.name,
				employeePosition: user?.position,
				...element.toJSON(),
			};
			return data;
		})
	);

	res.status(StatusCodes.OK).json({
		appraisalHistory,
	});
};

export const getMyAppraisalHistory = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	let filter: any;

	const appraisal = await Appraisal.find({ userId: user.userId }).sort({
		date: -1,
	});

	if (!appraisal) {
		throw new customAPIErrors(
			"Appraisal history not found",
			StatusCodes.NOT_FOUND
		);
	}

	const appraisalHistory = await Promise.all(
		appraisal.map(async (element) => {
			const user = await Employee.findOne({ userId: element.userId });

			const data = {
				employeeName: user?.name,
				employeePosition: user?.position,
				...element.toJSON(),
			};
			return data;
		})
	);

	res.status(StatusCodes.OK).json({
		appraisalHistory,
	});
};

export const getAppraisal = async (req: Request, res: Response) => {
	const { appraisalId } = req.params;

	const appraisal = await Appraisal.findById(appraisalId);

	if (!appraisal) {
		throw new customAPIErrors("Appraisal not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		appraisal,
	});
};
