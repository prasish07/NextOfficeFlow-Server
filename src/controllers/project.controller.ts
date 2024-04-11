import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Project, { IProject } from "../modals/project";
import Comment from "../modals/comment";
import Attachment from "../modals/attachment";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import {
	createNotification,
	createNotificationByRole,
} from "../utils/notification.helper";
import Employee from "../modals/employee";
import axios from "axios";
import { CREATE_REPO } from "../contants/conts";

export const createProject = async (req: Request, res: Response) => {
	const body = req.body;

	const user = (req as CustomerRequestInterface).user;
	const UserId = user.userId;

	const project = await Project.create({
		...body,
		UserId,
	});

	// create notification for all project managers
	createNotificationByRole({
		message: `New project was created with title ${project.title}`,
		role: "project manager",
		link: `/project/${project._id}`,
		type: "project",
	});

	// create notification for all admin
	createNotification({
		message: `New project was created with title ${project.title}`,
		role: "admin",
		link: `/project/${project._id}`,
		type: "project",
	});

	// create notification for all assignees
	const assignees = project.assigneeId || [];
	assignees.forEach((assigneeId: any) => {
		createNotification({
			message: `You have been assigned to a new project with title ${project.title}`,
			role: "assignee",
			link: `/project/${project._id}`,
			type: "project",
			userId: assigneeId,
		});
	});

	res.status(StatusCodes.CREATED).json({ project });
};

export const getProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	const project = await Project.findById(projectId)
		.populate("assigneeId")
		.populate("userId")
		.populate({
			path: "attachments",
			populate: {
				path: "userId",
			},
		});

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	res.status(StatusCodes.OK).json({ project });
};

export const getAllProject = async (req: Request, res: Response) => {
	const { isMyProjects } = req.query;
	const { userId } = (req as CustomerRequestInterface).user;
	const filter: any = {};

	if (isMyProjects) {
		filter.userId = userId;
	}

	const projects = await Project.find(filter)
		.populate("assigneeId")
		.populate("userId");

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
	}).populate("userId");

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	const PMName = await Employee.findOne({ userId: project.userId });

	// create notification for all project managers
	createNotificationByRole({
		message: `Project with title ${project.title} was updated by ${PMName}`,
		role: "admin",
		link: `/project/${project._id}`,
		type: "project",
	});

	// create notification for assignes and userid
	const users = project.assigneeId || [];
	users.push(project.userId);

	users.forEach((userId: any) => {
		createNotification({
			message: `Project with title ${project.title} was updated by ${PMName}`,
			role: "assignee",
			link: `/project/${project._id}`,
			type: "project",
			userId: userId,
		});
	});

	res.status(StatusCodes.OK).json({ project });
};

export const deleteProject = async (req: Request, res: Response) => {
	const { projectId } = req.params;

	if (!projectId) {
		throw new customAPIErrors("Project Id not found", StatusCodes.NOT_FOUND);
	}

	const project = await Project.findByIdAndRemove(projectId);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	const comments = await Comment.deleteMany({ projectId });

	const attachments = await Attachment.deleteMany({ projectId });

	// create notification for all project managers
	createNotificationByRole({
		message: `Project: ${projectId} was deleted`,
		role: "admin",
		link: `/project`,
		type: "project",
	});

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

	const existingAssigneeIds = project.assigneeId || [];

	// Filter out assigneeIds that already exist in the project
	const newAssigneeIds = assigneeIds.filter(
		(id: any) => !existingAssigneeIds.includes(id)
	);

	if (newAssigneeIds.length === 0) {
		return res
			.status(StatusCodes.OK)
			.json({ message: "No new assignees added", project });
	}

	project.assigneeId = [...existingAssigneeIds, ...newAssigneeIds];

	await project.save();

	// create notification for all new assignees
	newAssigneeIds.forEach((assigneeId: any) => {
		createNotification({
			message: `You have been assigned to a new project with title ${project.title}`,
			role: "assignee",
			link: `/project/${project._id}`,
			type: "project",
			userId: assigneeId,
		});
	});

	res
		.status(StatusCodes.OK)
		.json({ message: "Assignees added successfully", project });
};

export const addAttachmentToProject = async (req: Request, res: Response) => {
	const { attachments, projectId } = req.body;

	if (!projectId || !attachments) {
		throw new customAPIErrors(
			"Please provide attachment and projectId",
			StatusCodes.BAD_REQUEST
		);
	}

	const project = await Project.findById(projectId);
	const { userId } = (req as CustomerRequestInterface).user;

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}
	await Promise.all(
		attachments.map(async (attachment: any) => {
			const attachmentCreate = await Attachment.create({
				projectId,
				attachment,
				userId,
			});

			project.attachments = [...project.attachments, attachmentCreate._id];
		})
	);

	await project.save();

	res.status(StatusCodes.CREATED).json({ project });
};

export const linkGitHub = async (req: Request, res: Response) => {
	const { githubRepo } = req.body;
	const { projectId } = req.params;

	const regexPattern = new RegExp("/([^/]+)/?$");

	const match = githubRepo.match(regexPattern);

	if (!match) {
		throw new customAPIErrors(
			"Please provide a valid github repo with repo name in it",
			StatusCodes.BAD_REQUEST
		);
	}

	const project = await Project.findByIdAndUpdate(
		projectId,
		{ githubRepo: match[1] },
		{ new: true, runValidators: true }
	);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	// create notification for all project managers
	createNotificationByRole({
		message: `New GitHub link was created in project with title ${project.title}`,
		role: "project manager",
		link: `/project/${project._id}`,
		type: "project",
	});

	return res
		.status(StatusCodes.OK)
		.json({ message: "GitHub linked successfully", project });
};

export const CreateAndLinkGitHub = async (req: Request, res: Response) => {
	const { name, description, isPrivate, isReadme, readmeContent } = req.body;
	const { projectId } = req.params;
	const user = (req as CustomerRequestInterface).user;

	if (!name) {
		throw new customAPIErrors(
			"Please provide name and description",
			StatusCodes.BAD_REQUEST
		);
	}

	if (!projectId) {
		throw new customAPIErrors(
			"Please provide projectId",
			StatusCodes.BAD_REQUEST
		);
	}

	const project = await Project.findById(projectId);

	if (!project) {
		throw new customAPIErrors(
			`No project found with id: ${projectId}`,
			StatusCodes.NOT_FOUND
		);
	}

	try {
		const createRepo = await axios.post(
			CREATE_REPO,
			{
				name,
				description,
				private: isPrivate,
			},
			{
				headers: {
					Authorization: `token ${config.githubToken}`,
				},
			}
		);
	} catch (error: any) {
		throw new customAPIErrors(
			error.response.data.errors[0].message || "Error creating GitHub repo",
			error.response.status || StatusCodes.INTERNAL_SERVER_ERROR
		);
	}

	project.githubRepo = name;

	await project.save();

	// create notification for all project managers
	createNotificationByRole({
		message: `New GitHun link was created in project with title ${project.title}`,
		role: "project manager",
		link: `/project/${project._id}`,
		type: "project",
	});

	res.send({ message: "GitHub linked successfully", project });
};
