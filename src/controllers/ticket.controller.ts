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
import {
	createNotification,
	createNotificationByRole,
} from "../utils/notification.helper";

export const createTicket = async (req: Request, res: Response) => {
	const detail = req.body;
	const { dueDate, estimatedTime } = detail;
	const user = (req as CustomerRequestInterface).user;
	const { attachments } = detail;

	if (!dueDate || !estimatedTime) {
		throw new customAPIErrors(
			"Due date and estimated time is required",
			StatusCodes.BAD_REQUEST
		);
	}

	if (attachments) {
		const attachmentIds = await Promise.all(
			attachments.map(async (attachment: any) => {
				const newAttachment = new Attachment({
					attachment,
					userId: user.userId,
				});
				await newAttachment.save();
				return newAttachment._id;
			})
		);
		detail.attachments = attachmentIds;
	}

	if (parseInt(detail.estimatedTime) < 0) {
		throw new customAPIErrors(
			"Estimated time can not be negative",
			StatusCodes.BAD_REQUEST
		);
	}

	const ticket = new Ticket({
		reporterId: user.userId,
		...detail,
	});
	await ticket.save();

	if (detail.assigneeId)
		createNotification({
			message: `You have been assigned to a new ticket with title ${ticket.title}`,
			role: "assignee",
			link: `/ticket`,
			type: "ticket",
			userId: detail.assigneeId,
		});

	res.status(StatusCodes.CREATED).json({
		message: "Ticket created successfully",
		ticket,
	});
};

export const getTickets = async (req: Request, res: Response) => {
	const {
		assigneeToOnly,
		linkedProject,
		isMyTickets,
		status,
		reporter,
		employeeId,
	} = req.query;
	const { userId } = (req as CustomerRequestInterface).user;

	let filter: any = {};
	if (assigneeToOnly) {
		filter.assigneeId = assigneeToOnly;
	}
	if (linkedProject) {
		filter.linkedProject = linkedProject;
	}

	if (isMyTickets) {
		filter.assigneeId = userId;
	}
	if (status) {
		filter.status = status;
	}

	if (employeeId) {
		filter.assigneeId = employeeId;
	}

	if (reporter) {
		if (reporter === "me") {
			filter.reporterId = userId;
		} else {
			filter.reporterId = reporter;
		}
	}

	const tickets = await Ticket.find(filter)
		.populate("reporterId")
		.populate("assigneeId");
	res.status(StatusCodes.OK).json({ tickets });
};

export const getOneTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findById(ticketId)
		.populate("reporterId")
		.populate("assigneeId")
		.populate("attachments")
		.populate({
			path: "comments",
			populate: {
				path: "userId",
			},
		});
	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ ticket });
};

export const updateTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const detail = req.body;
	const { attachments, comment } = detail;
	const { userId, role } = (req as CustomerRequestInterface).user;
	let newAttachments: any = [];
	let newComments: any = [];

	if (parseInt(detail.estimatedTime) < 0) {
		throw new customAPIErrors(
			"Estimated time can not be negative",
			StatusCodes.BAD_REQUEST
		);
	}

	const ticket = await Ticket.findById(ticketId).populate("attachments");

	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}

	if (role === "employee" && detail.status) {
		if (ticket.assigneeId === null || !ticket.assigneeId) {
			throw new customAPIErrors(
				"This ticket is unassigned, you can not change the status",
				StatusCodes.FORBIDDEN
			);
		}

		if (ticket.assigneeId.toString() !== userId) {
			throw new customAPIErrors(
				"You are not allowed to change status of ticket that is not assign to you",
				StatusCodes.FORBIDDEN
			);
		}
	}

	const notPopulateTicket = await Ticket.findById(ticketId);

	if (!notPopulateTicket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}

	if (attachments) {
		const attachmentIds = await Promise.all(
			attachments.map(async (attach: any) => {
				// Check if attachment is already in the ticket
				const isAttachmentExist = ticket.attachments.find((attachment: any) => {
					return attachment.attachment === attach;
				});

				if (!isAttachmentExist) {
					const newAttachment = new Attachment({
						attachment: attach,
						userId,
					});
					await newAttachment.save();
					return newAttachment._id;
				}
			})
		);
		newAttachments = [...notPopulateTicket.attachments, ...attachmentIds];
	}

	if (comment) {
		const newComment = new Comment({
			comment,
			userId,
			ticketId,
		});
		await newComment.save();
		newComments = [...notPopulateTicket.comments, newComment._id];
	}

	const updateQuery = { ...detail };

	if (attachments) updateQuery.attachments = newAttachments;

	if (comment) updateQuery.comments = newComments;

	if (detail?.assigneeId === null) {
		updateQuery.assigneeId = null;
	}

	if (detail?.linkedProject === null) {
		updateQuery.linkedProject = null;
	}

	const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, updateQuery, {
		new: true,
		runValidators: true,
	});

	// create notification to reporterId
	if (ticket.reporterId && detail.isUpdateStatus) {
		createNotification({
			message: `Ticket status with title ${ticket.title} has been updated to ${ticket.status}`,
			link: `/ticket`,
			type: "ticket",
			userId: ticket.reporterId,
		});
	}

	// create notification to assigneeId
	if (ticket.assigneeId && detail.isAssigneeUser)
		createNotification({
			message: `The ticket : ${ticket.title} has been assignee to you.`,
			link: `/ticket`,
			type: "ticket",
			userId: detail.assigneeId,
		});

	res.status(StatusCodes.OK).json({ message: "Updated Successfully", ticket });
};

export const deleteTicket = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const ticket = await Ticket.findByIdAndRemove(ticketId);
	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}

	// create notification to reporterId
	createNotification({
		message: `Ticket : ${ticketId} has been deleted`,
		link: `/ticket`,
		type: "ticket",
	});

	// create notification to assigneeId
	if (ticket.assigneeId)
		createNotification({
			message: `The ticket : ${ticket.title} that has assigned to you has been updated`,
			link: `/ticket`,
			type: "ticket",
			userId: ticket.assigneeId,
		});

	res.status(StatusCodes.OK).json({ message: "Deleted Successfully" });
};

export const getProjectTickets = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const tickets = await Ticket.find({ linkedProject: projectId })
		.populate("reporterId")
		.populate("assigneeId");
	res.status(StatusCodes.OK).json({ tickets });
};

export const updateGrading = async (req: Request, res: Response) => {
	const { ticketId } = req.params;
	const { grading } = req.body;
	const user = (req as CustomerRequestInterface).user;
	if (user.role === "employee") {
		throw new customAPIErrors(
			"You are not allowed to grade",
			StatusCodes.FORBIDDEN
		);
	}
	const ticket = await Ticket.findByIdAndUpdate(
		ticketId,
		{ grading },
		{
			new: true,
			runValidators: true,
		}
	);
	if (!ticket) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}

	// create notification to assigneeId
	if (ticket.assigneeId)
		createNotification({
			message: `The ticket : ${ticket.title} has been graded by the project manager`,
			link: `/ticket`,
			type: "ticket",
			userId: ticket.assigneeId,
		});
	res.status(StatusCodes.OK).json({ message: "Grading updated successfully" });
};

export const RemoveTickets = async (req: Request, res: Response) => {
	const ticketList = req.body;

	const ticket = await Ticket.deleteMany({ _id: { $in: ticketList } });

	if (!ticket) {
		throw new customAPIErrors(
			`No ticket found with those ids`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ message: "Tickets deleted successfully" });
};

export const autoNotifyAdminAndAssigneeAboutDueTicketsOneWeekBefore =
	async () => {
		const tickets = await Ticket.find();

		if (!tickets || tickets.length === 0) {
			throw new customAPIErrors(`No tickets found`, StatusCodes.NOT_FOUND);
		}

		const oneWeekBeforeNow = new Date();
		oneWeekBeforeNow.setDate(oneWeekBeforeNow.getDate() + 7);

		tickets.forEach(async (ticket) => {
			const ticketDueDate = new Date(ticket.dueDate);

			if (
				ticketDueDate < oneWeekBeforeNow &&
				ticketDueDate >= new Date() &&
				ticket.status !== "Overdue"
			) {
				// Notify admin
				createNotificationByRole({
					message: `Ticket with title ${ticket.title} is due in one week`,
					role: "admin",
					link: `/ticket/${ticket._id}`,
					type: "ticket",
				});

				// Notify assignees
				const users = [];
				if (ticket.assigneeId) {
					users.push(ticket.assigneeId);
				}
				if (ticket.reporterId) {
					users.push(ticket.reporterId);
				}

				users.forEach((userId: any) => {
					createNotification({
						message: `Ticket with title ${ticket.title} is due in one week`,
						role: "employee",
						link: `/ticket`,
						type: "ticket",
						userId: userId,
					});
				});
				console.log("Notification sent for ticket", ticket.title);
			}
		});
	};

export const autoNotifyAdminAndAssigneeAboutOverdueTickets = async () => {
	const tickets = await Ticket.find();

	if (!tickets || tickets.length === 0) {
		throw new customAPIErrors(`No tickets found`, StatusCodes.NOT_FOUND);
	}

	tickets.forEach(async (ticket) => {
		if (
			new Date(ticket.dueDate) < new Date() &&
			ticket.status !== "Overdue" &&
			ticket.status !== "Cancelled"
		) {
			// Notify admin
			createNotificationByRole({
				message: `Ticket with title ${ticket.title} is overdue`,
				role: "admin",
				link: `/ticket`,
				type: "ticket",
			});

			// Notify assignees
			const users = [];

			if (ticket.assigneeId) {
				users.push(ticket.assigneeId);
			}
			if (ticket.reporterId) {
				users.push(ticket.reporterId);
			}

			users.forEach((userId: any) => {
				createNotification({
					message: `Ticket with title ${ticket.title} is overdue`,
					role: "employee",
					link: `/ticket`,
					type: "ticket",
					userId: userId,
				});
			});

			// Update ticket status to "overdue"
			const updatedTicket = await Ticket.findByIdAndUpdate(ticket._id, {
				status: "Overdue",
			});

			if (!updatedTicket) {
				throw new customAPIErrors(
					`No ticket found with id: ${ticket._id}`,
					StatusCodes.NOT_FOUND
				);
			}
			console.log(
				`Notification sent and status updated for ticket ${ticket.title}`
			);
		}
	});
};
