import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Notification from "../modals/notification";
import User from "../modals/user";

export const getNotifications = async (req: Request, res: Response) => {
	const { limit } = req.query;
	const user = (req as any).user;

	const limitNumber = parseInt(limit as string, 10) ?? 20;

	const notifications = await Notification.find({ userId: user.userId })
		.sort({ createdAt: -1 })
		.limit(limitNumber);

	res.status(StatusCodes.OK).json({ notifications });
};
