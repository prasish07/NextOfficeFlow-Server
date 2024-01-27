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
	UserId: string;
	from: string;
	to: string;
	status: string;
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
	UserId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	from: { type: String, required: true },
	to: { type: String, required: true },
	status: { type: String, required: true },
});

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
