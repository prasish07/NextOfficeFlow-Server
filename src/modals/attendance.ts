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
	late: boolean;
	overtime: boolean;
}

const attendanceSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	date: { type: Date, required: true },
	checkIn: { type: Date },
	checkOut: { type: Date },
	type: { type: String, enum: ["onsite", "remote"], required: true },
	location: { type: String, required: true },
	lat: { type: Number },
	lng: { type: Number },
	late: { type: Boolean },
	overtime: { type: Boolean },
});

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
