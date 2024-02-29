import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project from "../modals/project";
import Ticket from "../modals/ticket";
import Employee from "../modals/employee";
import User from "../modals/user";
import Attendance from "../modals/attendance";
import { LeaveDetail } from "../modals/employee";
import Requests from "../modals/request";
import { CustomerRequestInterface } from "../middleware/auth.middleware";

export const getEmployeeMeasures = async (req: Request, res: Response) => {
	let { userId, type, year } = req.body;

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
			AssigneeId: userId,
		});

		let ticketList: any = [];

		await Promise.all(
			projectCount.map(async (project) => {
				totalProject++;
				if (project.status === "completed") {
					completedProject++;
				}
				if (project.status === "overdue") {
					overdueProject++;
				}
				if (project.status === "cancelled") {
					cancelledProject++;
				}
				const ticketCount = await Ticket.find({
					projectId: project._id,
					assigneeId: userId,
				});

				totalTicketInProject = ticketCount.length;
				await Promise.all(
					ticketCount.map((ticket) => {
						if (ticket.status === "completed") {
							completedTicketInProject++;
						}
						if (ticket.status === "overdue") {
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
				if (ticket.status === "overdue") {
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
					$gte: new Date(year, 0, 1),
					$lt: new Date(year + 1, 0, 1),
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

		let result = [];
		let month = 0;

		if (year) {
			month = 12;
		} else {
			month = currentDate.getMonth();
		}

		for (let i = 0; i <= month; i++) {
			let present = calculateTotalDaysWithStatus("present", i);
			let absent = calculateTotalDaysWithStatus("absent", i);
			let remote = calculateTotalDaysWithType("remote", i);
			let onsite = calculateTotalDaysWithType("onsite", i);
			let total = present + absent;

			result.push({
				month: i,
				present,
				absent,
				remote,
				onsite,
				total,
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
