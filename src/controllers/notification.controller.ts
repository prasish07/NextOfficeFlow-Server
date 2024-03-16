import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Notification from "../modals/notification";
import User from "../modals/user";
import { CustomerRequestInterface } from "../middleware/auth.middleware";

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
