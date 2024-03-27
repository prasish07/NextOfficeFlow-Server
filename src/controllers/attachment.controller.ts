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

export const createAttachment = async (req: Request, res: Response) => {
	const body = req.body;
	const { projectId, ticketId } = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	if (!body.attachment) {
		throw new customAPIErrors(
			"Please provide attachment",
			StatusCodes.BAD_REQUEST
		);
	}

	const attachmentCreate = await Attachment.create({
		UserId,
		...body,
	});

	res.status(StatusCodes.CREATED).json({ attachmentCreate });
};

export const deleteAttachment = async (req: Request, res: Response) => {
	const { attachmentId } = req.params;

	if (!attachmentId) {
		throw new customAPIErrors("Attachment Id not found", StatusCodes.NOT_FOUND);
	}

	const attachment = await Attachment.findByIdAndDelete(attachmentId);

	if (!attachment) {
		throw new customAPIErrors(
			`No attachment found with id: ${attachmentId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ attachment });
};

export const getProjectAttachment = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	const attachments = await Attachment.find({ projectId }).populate("UserId");

	res.status(StatusCodes.OK).json({ attachments });
};

export const getTicketAttachment = async (req: Request, res: Response) => {
	const { ticketId } = req.params;

	const attachments = await Attachment.find({ ticketId });

	return res.status(StatusCodes.OK).json({ attachments });
};
