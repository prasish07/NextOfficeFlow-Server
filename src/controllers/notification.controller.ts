import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Notification from "../modals/notification";
import User from "../modals/user";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import { createNotificationAll } from "../utils/notification.helper";

export const getNotifications = async (req: Request, res: Response) => {
	const { limit } = req.query;
	const user = (req as CustomerRequestInterface).user;

	const limitNumber = parseInt(limit as string, 10) ?? 20;

	const notifications = await Notification.find({ userId: user.userId })
		.sort({ createdAt: -1 })
		.limit(limitNumber);

	res.status(StatusCodes.OK).json({ notifications });
};

export const getNotificationUnreadCount = async (
	req: Request,
	res: Response
) => {
	const user = (req as CustomerRequestInterface).user;

	const count = await Notification.find({
		userId: user.userId,
		isSeen: false,
	}).countDocuments();
	return res.status(StatusCodes.OK).json({ count });
};

export const updateSeen = async (req: Request, res: Response) => {
	const { notificationId } = req.params;
	const user = (req as CustomerRequestInterface).user;

	const updateNotification = await Notification.findByIdAndUpdate(
		notificationId,
		{ isSeen: true },
		{ new: true }
	);

	if (!updateNotification) {
		throw new customAPIErrors("Notification not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({ message: "Notification updated" });
};

export const markAllAsRead = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;

	const updateNotification = await Notification.updateMany(
		{ userId: user.userId, isSeen: false },
		req.body
	);

	res.status(StatusCodes.OK).json({ message: "All notifications updated" });
};

export const createNotification = async (req: Request, res: Response) => {
	const { userId, message, link, type } = req.body;

	const notification = await createNotificationAll({
		userId,
		message,
		link,
		type,
	});

	if (!notification) {
		throw new customAPIErrors(
			"Notification not created",
			StatusCodes.BAD_REQUEST
		);
	}

	return res.status(StatusCodes.OK).json({ message: "Notification created" });
};
