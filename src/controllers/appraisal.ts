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

export const getEmployeeProjectAndTicketMeasures = async (
	req: Request,
	res: Response
) => {
	const { userId } = req.body;
	let totalProject = 0;
	let completedProject =0;
	let overdueProject = 0;
	let cancelledProject = 0;
	let totalTicketInProject = 0;
	let completedTicketIn 
	let totalTicket = 0;

	const projectCount = await Project.find({
		AssigneeId: userId,
	});

	await Promise.all(
		projectCount.map(async (project) => {
			
		})
	);

	const ticketCount = await Ticket.find({
		assigneeId: userId,
	});

	const employeeDetails = await Employee.findById(userId);

	const employeeLeaveDetails = await LeaveDetail.findOne({ userId: userId });

	if (!employeeDetails)
		new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);

	res
		.status(StatusCodes.OK)
		.json({ projectCount, ticketCount, employeeDetails, employeeLeaveDetails });
};
