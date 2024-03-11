import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import User from "../modals/user";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import Announcement from "../modals/announcement";
import Employee from "../modals/employee";
import { sentEmail } from "../utils/mailTransporter";
import CalendarEvent from "../modals/calender";

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

	// Add event if req.body.addToCalender is yes
	// Add event to calender
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
		console.log("Event added to calender");
	}

	// sent mail to every one
	const employees = await Employee.find().populate("userId");
	employees.forEach((employee: any) => {
		console.log(employee.userId?.email, "Email sent");
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
	console.log(req.query);

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
