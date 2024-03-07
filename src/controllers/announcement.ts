import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import User from "../modals/user";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import Announcement from "../modals/announcement";

export const createAnnouncement = async (req: Request, res: Response) => {
	const { userId } = (req as CustomerRequestInterface).user;

	const announcement = new Announcement({
		userId,
		content: req.body.content,
		date: req.body.date,
		endDate: req.body.endDate,
		title: req.body.title,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await announcement.save();

	res
		.status(StatusCodes.CREATED)
		.json({ message: "Announcement created successfully" });
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
	const announcements = await Announcement.find().sort({ date: -1 });

	res.status(StatusCodes.OK).json({ announcements });
};

export const getAnnouncement = async (req: Request, res: Response) => {
	const { announcementId } = req.params;
	const announcement = await Announcement.findById(announcementId);

	if (!announcement) {
		throw new customAPIErrors("Announcement not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({ announcement });
};

export const updateAnnouncement = async (req: Request, res: Response) => {
	const { announcementId } = req.params;

	const announcement = await Announcement.findById(announcementId);

	if (!announcement) {
		throw new customAPIErrors("Announcement not found", StatusCodes.NOT_FOUND);
	}

	announcement.content = req.body.content;
	announcement.endDate = req.body.endDate;
	announcement.title = req.body.title;
	announcement.updatedAt = new Date();

	await announcement.save();

	res
		.status(StatusCodes.OK)
		.json({ message: "Announcement updated successfully" });
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
	const { announcementId } = req.params;

	const announcement = await Announcement.findByIdAndRemove(announcementId);

	if (!announcement) {
		throw new customAPIErrors("Announcement not found", StatusCodes.NOT_FOUND);
	}

	res
		.status(StatusCodes.OK)
		.json({ message: "Announcement deleted successfully" });
};
