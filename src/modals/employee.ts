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
}

const employeeSchema = new mongoose.Schema({
	name: { type: String, required: true },
	position: { type: String, required: true },
	department: { type: String, required: true },
	team: { type: String, required: true },
	manager: { type: String, required: true },
	description: { type: String, required: true },
	githubUsername: { type: String, required: true },
	appraisalHistory: { type: Array, required: true },
	salary: { type: Number, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	UserId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
});

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
