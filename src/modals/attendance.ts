import mongoose from "mongoose";

export interface IAttendance extends mongoose.Document {
	userId: string;
	date: Date;
	checkIn: Date;
	checkOut: Date;
	type: string;
	location: string;
}

const attendanceSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	date: { type: Date, required: true },
	checkIn: { type: Date, required: true },
	checkOut: { type: Date, required: true },
	type: { type: String, enum: ["onsite", "remote"], required: true },
	location: { type: String, required: true },
});

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
