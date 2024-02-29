import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project, { IProject } from "../modals/project";
import Comment from "../modals/comment";
import Attachment from "../modals/attachment";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";

export const createProject = async (req: Request, res: Response) => {
	const body = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	const project = await Project.create({
		...body,
		UserId,
	});

	res.status(StatusCodes.CREATED).json({ project });
};

export const getProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	const project = await Project.findById(projectId)
		.populate("AssigneeId")
		.populate("UserId");

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const getAllProject = async (req: Request, res: Response) => {
	const projects = await Project.find()
		.populate("AssigneeId")
		.populate("UserId");

	if (!projects) {
		throw new customAPIErrors(`No project found`, StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({ projects });
};

export const updateProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;
	const projectInfo = req.body;

	if (!projectId) {
		throw new customAPIErrors("Project Id not found", StatusCodes.NOT_FOUND);
	}

	const project = await Project.findByIdAndUpdate(projectId, projectInfo, {
		new: true,
	});

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const deleteProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	if (!projectId) {
		throw new customAPIErrors("Project Id not found", StatusCodes.NOT_FOUND);
	}

	const project = await Project.findByIdAndDelete(projectId);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const getProjectStatusCount = async (req: Request, res: Response) => {
	const projects = await Project.find();

	if (!projects) {
		throw new customAPIErrors(`No project found`, StatusCodes.NOT_FOUND);
	}
	let toDo = 0;
	let onGoing = 0;
	let completed = 0;
	let overDue = 0;
	let cancel = 0;
	let total = projects.length;

	projects.forEach((project) => {
		if (project.status === "To-Do") {
			toDo++;
		} else if (project.status === "onGoing") {
			onGoing++;
		} else if (project.status === "completed") {
			completed++;
		} else if (project.status === "cancel") {
			cancel++;
		}
		if (new Date(project.endDate) < new Date()) {
			overDue++;
		}
	});

	return res.status(StatusCodes.OK).json({
		toDo,
		total,
		completed,
		onGoing,
		overDue,
		cancel,
	});
};

export const addAssigneeToProject = async (req: Request, res: Response) => {
	const { assigneeIds } = req.body;

	const { projectId } = req.params;

	const project = await Project.findById(projectId);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	const existingAssigneeIds = project.AssigneeId || [];

	// Filter out assigneeIds that already exist in the project
	const newAssigneeIds = assigneeIds.filter(
		(id: any) => !existingAssigneeIds.includes(id)
	);

	if (newAssigneeIds.length === 0) {
		return res
			.status(StatusCodes.OK)
			.json({ message: "No new assignees added", project });
	}

	project.AssigneeId = [...existingAssigneeIds, ...newAssigneeIds];

	await project.save();

	res
		.status(StatusCodes.OK)
		.json({ message: "Assignees added successfully", project });
};
