import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project from "../modals/project";
import Comment from "../modals/comment";
import Attachment from "../modals/attachment";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";

export const createProject = async (req: Request, res: Response) => {
	const {
		title,
		Description,
		startDate,
		endDate,
		AssigneeId,
		Progress,
		status,
	} = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	if (
		!title ||
		!Description ||
		!startDate ||
		!endDate ||
		!AssigneeId ||
		!UserId ||
		!Progress ||
		!status
	) {
		throw new customAPIErrors(
			"Please provide all the required fields",
			StatusCodes.BAD_REQUEST
		);
	}

	const project = await Project.create({
		title,
		Description,
		startDate,
		endDate,
		AssigneeId,
		UserId,
		Progress,
		status,
	});

	res.status(StatusCodes.CREATED).json({ project });
};

export const getProject = async (req: Request, res: Response) => {
	const { id } = req.params;

	const project = await Project.findById(id);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const getAllProject = async (req: Request, res: Response) => {
	const projects = await Project.find();

	if (!projects) {
		throw new customAPIErrors(`No project found`, StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({ projects });
};

export const updateProject = async (req: Request, res: Response) => {
	const { id } = req.params;
	const projectInfo = req.body;

	if (!id) {
		throw new customAPIErrors("Project Id not found", StatusCodes.NOT_FOUND);
	}

	const project = await Project.findByIdAndUpdate(id, projectInfo, {
		new: true,
	});

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const deleteProject = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		throw new customAPIErrors("Project Id not found", StatusCodes.NOT_FOUND);
	}

	const project = await Project.findByIdAndDelete(id);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const createComment = async (req: Request, res: Response) => {
	const { comment, projectId } = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	if (!comment || !projectId) {
		throw new customAPIErrors(
			"Please provide all the required fields",
			StatusCodes.BAD_REQUEST
		);
	}

	const commentCreate = await Comment.create({
		comment,
		UserId,
		projectId,
	});

	res.status(StatusCodes.CREATED).json({ commentCreate });
};

export const deleteComment = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		throw new customAPIErrors("Comment Id not found", StatusCodes.NOT_FOUND);
	}

	const comment = await Comment.findByIdAndDelete(id);

	if (!comment) {
		throw new customAPIErrors(
			`No comment found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ comment });
};

export const getProjectComment = async (req: Request, res: Response) => {
	const { id } = req.params;

	const comments = await Comment.find({ projectId: id });

	if (!comments) {
		throw new customAPIErrors(
			`No comment found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ comments });
};

export const createAttachment = async (req: Request, res: Response) => {
	const { attachment, projectId } = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	if (!attachment || !projectId) {
		throw new customAPIErrors(
			"Please provide all the required fields",
			StatusCodes.BAD_REQUEST
		);
	}

	const attachmentCreate = await Attachment.create({
		attachment,
		UserId,
		projectId,
	});

	res.status(StatusCodes.CREATED).json({ attachmentCreate });
};

export const deleteAttachment = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		throw new customAPIErrors("Attachment Id not found", StatusCodes.NOT_FOUND);
	}

	const attachment = await Attachment.findByIdAndDelete(id);

	if (!attachment) {
		throw new customAPIErrors(
			`No attachment found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ attachment });
};

export const getProjectAttachment = async (req: Request, res: Response) => {
	const { id } = req.params;

	const attachments = await Attachment.find({ projectId: id });

	if (!attachments) {
		throw new customAPIErrors(
			`No attachment found with id: ${id}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ attachments });
};
