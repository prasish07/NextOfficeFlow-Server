import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import User from "../modals/user";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import Announcement from "../modals/announcement";
import Employee from "../modals/employee";
import { sentEmail } from "../utils/mailTransporter";
import CalendarEvent from "../modals/calender";
import {
	createNotification,
	createNotificationAll,
} from "../utils/notification.helper";
import { dateFormatter } from "../utils/helper";

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

	if (req.body.addToCalender === "yes") {
		const event = new CalendarEvent({
			userId,
			title: req.body.title,
			type: "announcement",
			start: req.body.date,
			end: req.body.endDate,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await event.save();
	}

	// sent notification to everyone
	createNotificationAll({
		message: `New announcement created: <strong>${
			req.body.title
		}</strong> on ${dateFormatter(req.body.date)}`,
		link: `/announcement`,
		type: "announcement",
	});

	// sent mail to every one
	const employees = await Employee.find().populate("userId");
	employees.forEach((employee: any) => {
		if (employee.userId.email)
			sentEmail(employee.userId.email, req.body.content, req.body.title);
	});

	res
		.status(StatusCodes.CREATED)
		.json({ message: "Announcement created successfully" });
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
	const { date, endDate } = req.query;
	const filter: any = {};

	if (date && endDate) {
		filter.date = { $gte: date, $lte: endDate };
	}

	const allAnnouncements = await Announcement.find(filter).sort({ date: -1 });

	const announcements = await Promise.all(
		allAnnouncements.map(async (announcement) => {
			const employee = await Employee.findOne({ userId: announcement.userId });

			return {
				...announcement.toJSON(),
				employeeName: employee?.name,
				employeePosition: employee?.position,
			};
		})
	);

	res.status(StatusCodes.OK).json({ announcements });
};

export const getAnnouncement = async (req: Request, res: Response) => {
	const { announcementId } = req.params;
	const data = await Announcement.findById(announcementId);

	if (!data) {
		throw new customAPIErrors("Announcement not found", StatusCodes.NOT_FOUND);
	}

	const employee = await Employee.findOne({ userId: data.userId });

	const announcement = {
		...data.toJSON(),
		employeeName: employee?.name,
		employeePosition: employee?.position,
	};

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

	// sent notification to everyone
	createNotificationAll({
		message: `Announcement updated: <strong>${req.body.title}</strong>`,
		link: `/announcement`,
		type: "announcement",
	});

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

	// sent notification to everyone
	createNotificationAll({
		message: `Announcement deleted: <strong>${announcement.title}</strong>`,
		link: `/announcement`,
		type: "announcement",
	});

	res
		.status(StatusCodes.OK)
		.json({ message: "Announcement deleted successfully" });
};
