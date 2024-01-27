import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Employee from "../modals/employee";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";

export interface employeeProps {
	name: string;
	position: string;
	department: string;
	team: string;
	manager: string;
	description: string;
	githubUsername: string;
	appraisalHistory: string[];
	salary: number;
	startDate: Date;
	endDate: Date;
	userId: string;
}

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
		from,
		to,
		status,
	} = req.body;

	const user = (req as CustomerRequestInterface).user;

	if (role === "admin" && user.role !== "admin") {
		throw new customAPIErrors(
			"You are not authorized to create admin position employee",
			StatusCodes.UNAUTHORIZED
		);
	}

	const password = `${name}@123`;

	// Create if same email exist or not
	let existingUser = await User.findOne({ email });

	if (existingUser) {
		throw new customAPIErrors(
			"User with this email already exist",
			StatusCodes.BAD_REQUEST
		);
	}

	// Create new Employee
	const employee = new Employee({
		name,
		position,
		department,
		team,
		manager,
		description,
		salary,
		startDate,
		endDate,
		from,
		to,
		status,
	});

	await employee.save();

	// Create new Employee with email and role
	const userEmployee = new User({
		email,
		password,
		role,
	});

	await userEmployee.save();

	const updatedEmployee = await Employee.findByIdAndUpdate(
		employee._id,
		{ userId: userEmployee._id },
		{ new: true }
	);

	res.status(StatusCodes.CREATED).json({
		message: "Employee created successfully",
	});
};

export const updateEmployee = async (req: Request, res: Response) => {
	const employeeInfo = req.body;
	const employeeId = req.params.id;

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employeeUpdate = await Employee.findByIdAndUpdate(
		employeeId,
		...employeeInfo
	);

	if (!employeeUpdate) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		message: "Employee updated successfully",
		data: employeeUpdate,
	});
};

export const deleteEmployee = async (req: Request, res: Response) => {
	const employeeId = req.params.id;

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employeeDelete = await Employee.findByIdAndDelete(employeeId);

	console.log(employeeDelete);

	if (!employeeDelete) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		message: "Employee deleted successfully",
		data: employeeDelete,
	});
};

export const getAllEmployees = async (req: Request, res: Response) => {
	const employees = await Employee.find();

	if (!employees.length) {
		throw new customAPIErrors("No employees found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		message: "Employees found",
		data: employees,
	});
};

export const getEmployee = async (req: Request, res: Response) => {
	const employeeId = req.params.id;

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employee = await Employee.findById(employeeId);

	if (!employee) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		message: "Employee found",
		data: employee,
	});
};
