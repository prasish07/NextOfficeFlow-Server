import mongoose from "mongoose";

export interface IRequest extends mongoose.Document {
	userId: string;
	requestType: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	leaveId: string;
	allowanceId: string;
	overtimeId: string;
}

export interface ILeave extends mongoose.Document {
	type: string;
	startDate: Date;
	endDate: Date;
	reason: string;
	status: string;
}

export interface IAllowance extends mongoose.Document {
	amount: number;
	reason: string;
	date: Date;
}

export interface IOvertime extends mongoose.Document {
	date: Date;
	startTime: string;
	endTime: string;
	reason: string;
}

export interface IAttendance extends mongoose.Document {
	date: Date;
	reason: string;
}

const requestSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	requestType: { type: String, required: true },
	status: { type: String, required: true, default: "pending" },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	leaveId: { type: mongoose.Schema.Types.ObjectId, ref: "Leave" },
	allowanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Allowance" },
	overtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Overtime" },
	attendanceId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "AttendanceRequest",
	},
	
});

const leaveSchema = new mongoose.Schema({
	type: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	reason: { type: String, required: true },
	status: { type: String, default: "Unknown" },
});

const allowanceSchema = new mongoose.Schema({
	amount: { type: Number, required: true },
	reason: { type: String, required: false },
	date: { type: Date, required: true },
});

const overtimeSchema = new mongoose.Schema({
	date: { type: Date, required: true },
	startTime: { type: String, required: true },
	endTime: { type: String, required: true },
	reason: { type: String, required: true },
});

const attendanceSchema = new mongoose.Schema({
	date: { type: Date, required: true },
	reason: { type: String, required: true },
});

export const Leave = mongoose.model<ILeave>("Leave", leaveSchema);
export const Allowance = mongoose.model<IAllowance>(
	"Allowance",
	allowanceSchema
);
export const Overtime = mongoose.model<IOvertime>("Overtime", overtimeSchema);
export const Attendance = mongoose.model<IAttendance>(
	"AttendanceRequest",
	attendanceSchema
);

const Request = mongoose.model<IRequest>("Request", requestSchema);

export default Request;
