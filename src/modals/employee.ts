import mongoose from "mongoose";

export interface IEmployee extends mongoose.Document {
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
	from: string;
	to: string;
	status: string;
	jobDescription: string;
	documents: string[];
}

export interface ILeaveDetail extends mongoose.Document {
	userId: string;
	availableLeaves: number;
	leavesTaken: number;
	year: number;
	totalPaidLeaveTaken: number;
	totalUnpaidLeaveTaken: number;
}

const employeeSchema = new mongoose.Schema({
	name: { type: String, required: true },
	position: { type: String, required: true },
	department: { type: String, required: true },
	team: { type: String },
	manager: { type: String },
	description: { type: String },
	githubUsername: { type: String },
	appraisalHistory: { type: Array },
	salary: { type: Number, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	from: { type: String, required: true },
	to: { type: String, required: true },
	status: { type: String, required: true },
	jobDescription: { type: String },
	documents: [
		{
			type: String,
		},
	],
});

const leaveDetailSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	totalPaidLeaveTaken: { type: Number },
	availableLeaves: { type: Number },
	leavesTaken: { type: Number },
	year: { type: Number },
	totalUnpaidLeaveTaken: { type: Number },
});

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);

export const LeaveDetail = mongoose.model<ILeaveDetail>(
	"LeaveDetail",
	leaveDetailSchema
);

export default Employee;
