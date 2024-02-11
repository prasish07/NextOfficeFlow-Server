import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Attendance from "../modals/attendance";
import mongoose from "mongoose";

export const checkIn = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;

	const { location, type } = req.body;

	const checkIn = new Date();

	const attendance = new Attendance({
		userId: user.userId,
		date: new Date(),
		checkIn,
		type,
		location,
	});

	await attendance.save();

	res.status(StatusCodes.OK).json({
		message: "Checked In",
	});
};

export const checkOut = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;

	const checkOut = new Date();

	const attendance = await Attendance.findOne({
		userId: user.userId,
		date: new Date(),
	});

	if (!attendance) {
		throw new customAPIErrors("No check-in found", StatusCodes.NOT_FOUND);
	}

	attendance.checkOut = checkOut;

	await attendance.save();

	res.status(StatusCodes.OK).json({
		message: "Checked Out",
	});
};

export const getTodayAttendance = async (req: Request, res: Response) => {
	const todayAttendance = await Attendance.find({
		date: new Date(),
	});

	res.status(StatusCodes.OK).json({
		todayAttendance,
	});
};

export const getAllTimeAttendance = async (req: Request, res: Response) => {
	const allTimeAttendance = await Attendance.find();
	res.status(StatusCodes.OK).json({
		allTimeAttendance,
	});
};

export const getAttendanceByDate = async (req: Request, res: Response) => {
	const { date } = req.params;
	const attendance = await Attendance.find({
		date,
	});
	res.status(StatusCodes.OK).json({
		attendance,
	});
};

export const manualAttendance = async (req: Request, res: Response) => {
	const { date, checkIn, checkOut, type, location, userId } = req.body;
	const attendance = new Attendance({
		userId: userId,
		date,
		checkIn,
		checkOut,
		type,
		location,
	});
	await attendance.save();
	res.status(StatusCodes.OK).json({
		message: "Attendance added",
	});
};

export const getAttendanceByUserId = async (req: Request, res: Response) => {
	const { userId } = req.params;
	const attendance = await Attendance.find({
		userId,
	});
	res.status(StatusCodes.OK).json({
		attendance,
	});
};
