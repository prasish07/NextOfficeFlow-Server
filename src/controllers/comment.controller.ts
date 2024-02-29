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

export const createComment = async (req: Request, res: Response) => {
	const body = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	if (!body.comment) {
		throw new customAPIErrors(
			"Please provide comment",
			StatusCodes.BAD_REQUEST
		);
	}

	const commentCreate = await Comment.create({
		UserId,
		...body,
	});

	res.status(StatusCodes.CREATED).json({ message: "Comment added" });
};

export const deleteComment = async (req: Request, res: Response) => {
	const { commentID } = req.params;

	if (!commentID) {
		throw new customAPIErrors("Comment Id not found", StatusCodes.NOT_FOUND);
	}

	const comment = await Comment.findByIdAndDelete(commentID);

	if (!comment) {
		throw new customAPIErrors(
			`No comment found with id: ${commentID}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ comment });
};

export const getProjectComment = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	const comments = await Comment.find({ projectId: projectId }).populate(
		"UserId"
	);

	if (!comments) {
		throw new customAPIErrors(
			`No comment found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ comments });
};

export const getTicketComment = async (req: Request, res: Response) => {
	const { ticketId } = req.params;

	const comments = await Comment.find({ ticketId: ticketId });

	if (!comments) {
		throw new customAPIErrors(
			`No comment found with id: ${ticketId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ comments });
};
