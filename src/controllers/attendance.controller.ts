import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Attendance from "../modals/attendance";
import mongoose from "mongoose";
import Employee from "../modals/employee";

export const checkIn = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { location, type, lat, lng } = req.body;
	const checkIn = new Date();
	const isLate = checkIn.getHours() >= 9;

	// Check if an attendance record for the same user and date already exists
	const existingAttendance = await Attendance.findOne({
		userId: user.userId,
		date: {
			$gte: new Date(
				checkIn.getFullYear(),
				checkIn.getMonth(),
				checkIn.getDate()
			),
			$lt: new Date(
				checkIn.getFullYear(),
				checkIn.getMonth(),
				checkIn.getDate() + 1
			),
		},
	});

	if (existingAttendance) {
		// If record exists, update it
		existingAttendance.type = type;
		existingAttendance.location = location;
		existingAttendance.checkIn = checkIn;
		existingAttendance.lat = lat;
		existingAttendance.lng = lng;
		existingAttendance.late = isLate;

		await existingAttendance.save();
	} else {
		// If record does not exist, create a new one
		const attendance = new Attendance({
			userId: user.userId,
			date: new Date(
				checkIn.getFullYear(),
				checkIn.getMonth(),
				checkIn.getDate()
			),
			checkIn,
			type,
			location,
			lat,
			lng,
			late: isLate,
		});

		await attendance.save();
	}

	res.status(StatusCodes.OK).json({
		message: "Checked In",
	});
};

export const checkOut = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;

	const checkOut = new Date();

	// Find the attendance record for the user and current date
	const attendance = await Attendance.findOne({
		userId: user.userId,
		date: {
			$gte: new Date(
				checkOut.getFullYear(),
				checkOut.getMonth(),
				checkOut.getDate()
			),
			$lt: new Date(
				checkOut.getFullYear(),
				checkOut.getMonth(),
				checkOut.getDate() + 1
			),
		},
	});

	if (!attendance) {
		throw new customAPIErrors("No check-in found", StatusCodes.NOT_FOUND);
	}

	attendance.checkOut = checkOut;

	const isOvertime = checkOut.getHours() >= 17;
	attendance.overtime = isOvertime;

	await attendance.save();

	res.status(StatusCodes.OK).json({
		message: "Checked Out",
	});
};

export const getAllTimeAttendance = async (req: Request, res: Response) => {
	const { date, late, overtime } = req.query;

	// Build the filter criteria
	const filter: any = {};

	if (date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (date === "today") {
			filter.date = today;
		} else if (date === "thisWeek") {
			const firstDayOfWeek = new Date(today);
			firstDayOfWeek.setDate(today.getDate() - today.getDay());
			filter.date = { $gte: firstDayOfWeek, $lt: today };
		} else if (date === "thisMonth") {
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1
			);
			filter.date = { $gte: firstDayOfMonth, $lt: today };
		} else if (typeof date === "string") {
			// Assuming the date format is 'YYYY-MM-DD'
			const [from, to] = date.split("-");
			filter.date = { $gte: new Date(from), $lt: new Date(to) };
		}
	}

	if (late === "true") {
		filter.late = true;
	}

	if (overtime === "true") {
		filter.overtime = true;
	}

	const allTimeAttendance = await Attendance.find(filter);

	const attendanceWithEmployeeData = await Promise.all(
		allTimeAttendance.map(async (attendance) => {
			const employee = await Employee.findOne({ userId: attendance.userId });

			return {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...attendance.toJSON(),
			};
		})
	);

	res.status(StatusCodes.OK).json({
		allTimeAttendance: attendanceWithEmployeeData,
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
	const { date, late, overtime } = req.query;

	const filter: any = { userId };

	if (date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (date === "today") {
			filter.date = today;
		} else if (date === "thisWeek") {
			const firstDayOfWeek = new Date(today);
			firstDayOfWeek.setDate(today.getDate() - today.getDay());
			filter.date = { $gte: firstDayOfWeek, $lt: today };
		} else if (date === "thisMonth") {
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1
			);
			filter.date = { $gte: firstDayOfMonth, $lt: today };
		} else if (typeof date === "string") {
			// Assuming the date format is 'YYYY-MM-DD'
			const [from, to] = date.split("-");
			filter.date = { $gte: new Date(from), $lt: new Date(to) };
		}
	}

	if (late === "true") {
		filter.late = true;
	}

	if (overtime === "true") {
		filter.overtime = true;
	}

	const attendance = await Attendance.find(filter);

	const attendanceWithEmployeeData = await Promise.all(
		attendance.map(async (entry) => {
			const employee = await Employee.findOne({ userId: entry.userId });

			return {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...entry.toJSON(),
			};
		})
	);

	res.status(StatusCodes.OK).json({
		attendance: attendanceWithEmployeeData,
	});
};

export const getAttendanceByUserIdAndToday = async (
	req: Request,
	res: Response
) => {
	const { userId } = (req as CustomerRequestInterface).user;

	const today = new Date();
	const startOfDay = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate()
	);
	const endOfDay = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate() + 1
	);

	const attendance = await Attendance.find({
		userId,
		date: {
			$gte: startOfDay,
			$lt: endOfDay,
		},
	});

	res.status(StatusCodes.OK).json({
		attendance: attendance[0],
	});
};
