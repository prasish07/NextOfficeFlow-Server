import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import Attendance from "../modals/attendance";
import mongoose from "mongoose";
import Employee from "../modals/employee";
import { createNotification } from "../utils/notification.helper";

export const checkIn = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	const { location, type, lat, lng } = req.body;
	const checkIn = new Date();
	const status = checkIn.getHours() >= 9 ? "late" : "onTime";

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

	if (existingAttendance?.checkOut) {
		throw new customAPIErrors(
			"You can't check in after checking out",
			StatusCodes.BAD_REQUEST
		);
	}

	if (checkIn.getHours() >= 17) {
		throw new customAPIErrors(
			"You can't check in after 5 PM",
			StatusCodes.BAD_REQUEST
		);
	}

	if (existingAttendance) {
		existingAttendance.type = type;
		existingAttendance.location = location;
		existingAttendance.checkIn = checkIn.toString();
		existingAttendance.lat = lat;
		existingAttendance.lng = lng;
		existingAttendance.checkInStatus = status;
		existingAttendance.status = "present";

		await existingAttendance.save();
	} else {
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
			late: status,
			status: "present",
			checkInStatus: status,
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

	if (!attendance.checkIn) {
		throw new customAPIErrors(
			"You have not checked in",
			StatusCodes.BAD_REQUEST
		);
	}

	attendance.checkOut = checkOut.toString();

	const isOvertime = checkOut.getHours() >= 17;
	const status = checkOut.getHours() < 17 ? "early" : "onTime";
	attendance.overtime = isOvertime;
	attendance.checkOutStatus = status;

	await attendance.save();

	res.status(StatusCodes.OK).json({
		message: "Checked Out",
	});
};

export const getAllTimeAttendance = async (req: Request, res: Response) => {
	const { startDate, endDate, late, overtime, searchEmployee } = req.query;

	// Build the filter criteria
	const filter: any = {};

	let TotalWorkingDays = 0;
	let TotalPresent = 0;
	let TotalAbsent = 0;
	let TotalLate = 0;
	let TotalOnTime = 0;
	let TotalEarlyLeave = 0;
	let TotalOvertime = 0;

	if ((startDate && !endDate) || (endDate && !startDate)) {
		throw new customAPIErrors(
			"Both start and end date are required",
			StatusCodes.BAD_REQUEST
		);
	}

	if (startDate && endDate) {
		filter.date = {
			$gte: new Date(startDate as string),
			$lt: new Date(endDate as string),
		};
	}

	if (late === "true") {
		filter.late = true;
	}

	if (overtime === "true") {
		filter.overtime = true;
	}

	const totalAttendance = await Attendance.find();

	const allTimeAttendance = await Attendance.find(filter).sort({ date: -1 });

	const currentDate = new Date();
	const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
	let totalWorkingDays = 0;

	for (let d = startOfYear; d <= currentDate; d.setDate(d.getDate() + 1)) {
		// Check if the current day is not a Saturday or Sunday
		if (d.getDay() !== 0 && d.getDay() !== 6) {
			totalWorkingDays++;
		}
	}

	allTimeAttendance.map((attendance) => {
		if (attendance.status === "present") {
			TotalPresent++;
		} else if (attendance.status === "absent") {
			TotalAbsent++;
		}

		if (attendance.checkInStatus === "late") {
			TotalLate++;
		}
		if (attendance.checkOutStatus === "onTime") {
			TotalOnTime++;
		} else if (attendance.checkOutStatus === "early") {
			TotalEarlyLeave++;
		}

		if (attendance.overtime) {
			TotalOvertime++;
		}
	});

	let attendanceWithEmployeeData: any = [];

	attendanceWithEmployeeData = await Promise.all(
		allTimeAttendance.map(async (attendance) => {
			const employee = await Employee.findOne({ userId: attendance.userId });

			return {
				employeeName: employee ? employee.name : "Unknown",
				employeePosition: employee ? employee.position : "Unknown",
				...attendance.toJSON(),
			};
		})
	);

	if (searchEmployee) {
		attendanceWithEmployeeData = attendanceWithEmployeeData.filter(
			(attendance: any) =>
				attendance.employeeName
					.toLowerCase()
					.includes((searchEmployee as string).toLowerCase())
		);
	}

	res.status(StatusCodes.OK).json({
		allTimeAttendance: attendanceWithEmployeeData,
		totalWorkingDays,
		TotalPresent,
		TotalAbsent,
		TotalLate,
		TotalOnTime,
		TotalEarlyLeave,
	});
};

export const manualAttendance = async (req: Request, res: Response) => {
	const { employeeId, date, checkIn, checkOut, status, reason } = req.body.data;

	if (!employeeId) {
		throw new customAPIErrors(
			"Employee Id is required",
			StatusCodes.BAD_REQUEST
		);
	}

	if (!checkIn || !checkOut || !status) {
		throw new customAPIErrors(
			"Check In, Check Out and Status are required",
			StatusCodes.BAD_REQUEST
		);
	}

	if (!reason) {
		throw new customAPIErrors("Reason is required", StatusCodes.BAD_REQUEST);
	}

	const userId = await User.findById(employeeId);

	if (!userId) {
		throw new customAPIErrors("User not found", StatusCodes.NOT_FOUND);
	}

	console.log(userId);

	const attendance = new Attendance({
		date: new Date(date),
		checkIn,
		checkOut,
		status,
		reason,
		userId: userId._id,
	});
	await attendance.save();
	res.status(StatusCodes.OK).json({
		message: "Attendance added",
	});
};

export const getSingleAttendance = async (req: Request, res: Response) => {
	const { id } = req.params;

	const attendance = await Attendance.findById(id);

	if (!attendance) {
		throw new customAPIErrors("Attendance not found", StatusCodes.NOT_FOUND);
	}

	const employee = await User.findById(attendance.userId);

	res.status(StatusCodes.OK).json({
		employeeEmail: employee ? employee.email : "Unknown",
		...attendance.toJSON(),
	});
};

export const getAttendanceByUserId = async (req: Request, res: Response) => {
	let { userId } = req.params;
	if (!userId) {
		userId = (req as CustomerRequestInterface).user.userId;
	}
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

export const getTodayTotalAttendance = async (req: Request, res: Response) => {
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

	const totalAttendance = await Attendance.countDocuments({
		date: {
			$gte: startOfDay,
			$lt: endOfDay,
		},
		status: "present",
	});

	res.status(StatusCodes.OK).json({
		totalAttendance,
	});
};

export const markAbsentEmployeesForToday = async () => {
	try {
		const currentDay = new Date();
		const dayOfWeek = currentDay.getDay();

		if (dayOfWeek === 0 || dayOfWeek === 6) {
			console.log("It is a weekend. Skipping making absent for today");
			return;
		}

		// Retrieve all employees
		const employees = await Employee.find().populate("userId");

		const allEmployees = employees.filter(
			(employee: any) => employee.userId.role === "employee"
		);

		// Iterate through each employee and check if they have a check-in for today
		await Promise.all(
			allEmployees.map(async (employee) => {
				const employeeCheckInRecord = await Attendance.findOne({
					userId: employee.userId,
					date: {
						$gte: new Date(currentDay),
						$lt: new Date(
							new Date(currentDay).setDate(new Date(currentDay).getDate() + 1)
						),
					},
				});

				if (!employeeCheckInRecord) {
					// If no check-in record, mark the employee as absent
					const attendance = new Attendance({
						userId: employee.userId,
						date: new Date(currentDay),
						status: "absent",
					});

					await attendance.save();

					// Send a notification to the employee
					createNotification({
						message: `You have been marked as absent for today. Please contact your manager if this is a mistake.`,
						link: `/employee/my-profile`,
						type: "attendance",
						userId: employee.userId,
					});
				}
			})
		);
	} catch (error) {
		console.log(error);
	}
};

export const getTodayUnCheckedEmployees = async (
	req: Request,
	res: Response
) => {
	const currentDay = new Date();
	const dayOfWeek = currentDay.getDay();

	if (dayOfWeek === 0 || dayOfWeek === 6) {
		console.log("It is a weekend. Skipping making absent for today");
		return;
	}

	const employees = await Employee.find().populate("userId");

	const allEmployees = employees.filter(
		(employee: any) =>
			employee.userId.role === "employee" ||
			employee.userId.role === "project manager"
	);

	const uncheckedEmployees = await Promise.all(
		allEmployees.map(async (employee) => {
			const employeeCheckInRecord = await Attendance.findOne({
				userId: employee.userId,
				date: {
					$gte: new Date(currentDay),
					$lt: new Date(
						new Date(currentDay).setDate(new Date(currentDay).getDate() + 1)
					),
				},
			});

			if (!employeeCheckInRecord) {
				return employee;
			}
		})
	);

	res.status(StatusCodes.OK).json({
		uncheckedEmployees: uncheckedEmployees.filter((employee) => employee),
	});
};
