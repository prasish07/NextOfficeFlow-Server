import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import Employee from "../modals/employee";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import User from "../modals/user";
import { hashPassword } from "../utils/auth.helper";

export type employeeProps = {
	name: string;
	position: string;
	department: string;
	status: string;
	team: string;
	manager: string;
	description: string;
	githubUsername?: string;
	appraisalHistory?: string[];
	salary: number;
	startDate: Date;
	endDate: Date;
	userId: string;
	from: string;
	to: string;
};

type EmployeeDocument = Document & employeeProps;

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
		documents,
	} = req.body;

	const user = (req as CustomerRequestInterface).user;

	if (role === "admin" && user.role !== "admin") {
		throw new customAPIErrors(
			"You are not authorized to create admin position employee",
			StatusCodes.UNAUTHORIZED
		);
	}

	const splitName = name.split(" ");
	const firstName = splitName[0];

	const password = `${firstName}@123`;

	const encryptedPassword = hashPassword(password);

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
		documents,
	});

	await employee.save();

	// Create new Employee with email and role
	const userEmployee = new User({
		email,
		password: encryptedPassword,
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
		data: updatedEmployee,
	});
};

export const updateEmployee = async (req: Request, res: Response) => {
	const employeeInfo = req.body;
	const { employeeId } = req.params;

	const user = (req as CustomerRequestInterface).user;

	if (employeeInfo.role === "admin" && user.role !== "admin") {
		throw new customAPIErrors(
			"You are not authorized to create admin position employee",
			StatusCodes.UNAUTHORIZED
		);
	}

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employeeUpdate: EmployeeDocument | null =
		await Employee.findByIdAndUpdate(
			employeeId,
			{ $set: employeeInfo },
			{ new: true }
		);

	const userUpdate = await User.findByIdAndUpdate(
		employeeUpdate?.userId,
		{ $set: { role: employeeInfo.role, email: employeeInfo.email } },
		{ new: true }
	);

	if (!employeeUpdate || !userUpdate) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({
		message: "Employee updated successfully",
		data: employeeUpdate,
	});
};

export const deleteEmployee = async (req: Request, res: Response) => {
	const { employeeId } = req.params;

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employeeDelete: any = await Employee.findByIdAndDelete(employeeId);

	if (!employeeDelete) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	const userDelete = await User.findByIdAndDelete(employeeDelete.userId);

	if (!userDelete) {
		throw new customAPIErrors("User not found", StatusCodes.NOT_FOUND);
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
	const { employeeId } = req.params;

	if (!employeeId) {
		throw new customAPIErrors("Employee Id not found", StatusCodes.NOT_FOUND);
	}

	const employee = await Employee.findById(employeeId).populate("userId");

	if (!employee) {
		throw new customAPIErrors("Employee not found", StatusCodes.NOT_FOUND);
	}

	res.status(StatusCodes.OK).json({
		message: "Employee found",
		data: employee,
	});
};

export const getUserInformation = async (req: Request, res: Response) => {
	const { userId } = req.params;
	const userInfo = await Employee.findOne({ userId }).populate("userId");
	if (!userInfo) {
		throw new customAPIErrors("User not found", StatusCodes.NOT_FOUND);
	}
	res.status(StatusCodes.OK).json({
		message: "User found",
		data: userInfo,
	});
};
