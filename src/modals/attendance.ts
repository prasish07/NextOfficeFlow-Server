import mongoose from "mongoose";

export interface IAttendance extends mongoose.Document {
	userId: string;
	date: Date;
	checkIn: Date;
	checkOut: Date;
	type: string;
	location: string;
	lat: number;
	lng: number;
	checkInStatus: string;
	checkOutStatus: string;
	overtime: boolean;
	reason: string;
	status: string;
}

const attendanceSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	date: { type: Date, required: true },
	checkIn: { type: Date },
	checkOut: { type: Date },
	type: { type: String, enum: ["onsite", "remote"] },
	location: { type: String },
	lat: { type: Number },
	lng: { type: Number },
	checkInStatus: { type: String },
	checkOutStatus: { type: String },
	overtime: { type: Boolean },
	reason: { type: String },
	status: { type: String, enum: ["present", "absent"] },
});

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
