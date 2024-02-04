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

export const createProject = async (
	req: CustomerRequestInterface,
	res: Response
) => {
	const detail = req.body;
	const user = (req as CustomerRequestInterface).user;

	const project = new Project({
		userId: user.userId,
		...detail,
	});
	await project.save();
	res.status(StatusCodes.CREATED).json({
		message: "Project created successfully",
		project,
	});
};

export const getProjects = async (req: Request, res: Response) => {
	const projects = await Project.find()
		.populate("reporterId")
		.populate("assigneeId");
	res.status(StatusCodes.OK).json({ projects });
};

export const getOneProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const project = await Project.findById(projectId)
		.populate("reporterId")
		.populate("assigneeId");
	if (!project) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ project });
};

export const updateProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const detail = req.body;
	const project = await Project.findByIdAndUpdate(projectId, detail, {
		new: true,
		runValidators: true,
	});

	if (!project) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ message: "Updated Successfully", project });
};

export const deleteProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const project = await Project.findByIdAndDelete(projectId);
	if (!project) {
		throw new customAPIErrors("Project not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({ message: "Deleted Successfully" });
};
