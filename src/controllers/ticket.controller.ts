import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project from "../modals/project";
import Comment from "../modals/comment";
import Attachment from "../modals/attachment";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Ticket from "../modals/ticket";

export const createTicket = async (req: Request, res: Response) => {
	const detail = req.body;
	const user = (req as CustomerRequestInterface).user;

	const ticket = new Ticket({
		reporterId: user.userId,
		...detail,
	});
	await ticket.save();
	res.status(StatusCodes.CREATED).json({
		message: "Project created successfully",
		ticket,
	});
};

export const getTickets = async (req: Request, res: Response) => {
	const tickets = await Ticket.find()
		.populate("reporterId")
		.populate("assigneeId");
	res.status(StatusCodes.OK).json({ tickets });
};

export const getOneTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findById(ticketId)
		.populate("reporterId")
		.populate("assigneeId");
	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ ticket });
};

export const updateTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const detail = req.body;
	const ticket = await Ticket.findByIdAndUpdate(ticketId, detail, {
		new: true,
		runValidators: true,
	});

	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ message: "Updated Successfully", ticket });
};

export const deleteTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findByIdAndDelete(ticketId);
	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ message: "Deleted Successfully" });
};

export const getProjectTickets = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const tickets = await Ticket.find({ linkedProjects: projectId })
		.populate("reporterId")
		.populate("assigneeId");
	res.status(StatusCodes.OK).json({ tickets });
};
