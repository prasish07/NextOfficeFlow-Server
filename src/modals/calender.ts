import mongoose, { Schema } from "mongoose";

export interface ICalendarEvent extends mongoose.Document {
	title: string;
	description: string;
	startDate: Date;
	endDate: Date;
	type: string;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

const calendarEventSchema = new Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	type: { type: String, required: true },
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const CalendarEvent = mongoose.model<ICalendarEvent>(
	"CalendarEvent",
	calendarEventSchema
);

export default CalendarEvent;
