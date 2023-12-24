import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Employee from "../modals/employee";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";

export const createEmployee = async (req: Request, res: Response) => {
	const {
		name,
		position,
		department,
		team,
		manager,
		description,
		githubUsername,
		appraisalHistory,
		salary,
		startDate,
		endDate,
		email,
		role,
	} = req.body;

	const user = (req as CustomerRequestInterface).user;

	if (role === "admin" && user.role !== "admin") {
		throw new customAPIErrors(
			"You are not authorized to create admin position employee",
			StatusCodes.UNAUTHORIZED
		);
	}

	// Create if same email exist or not
	let existingUser = await User.findOne({ where: { email } });

	if (existingUser) {
		throw new customAPIErrors(
			"User with this email already exist",
			StatusCodes.BAD_REQUEST
		);
	}

	// Create new Employee with email and role
	const userEmployee = new User({
		email,
		role,
	});

	await userEmployee.save();

	// Create new Employee
	const employee = new Employee({
		name,
		position,
		department,
		team,
		manager,
		description,
		githubUsername,
		appraisalHistory,
		salary,
		startDate,
		endDate,
		userId: userEmployee.id,
	});

	await employee.save();

	res.status(StatusCodes.CREATED).json({
		message: "Employee created successfully",
		data: employee,
	});
};
