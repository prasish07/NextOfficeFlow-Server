import mongoose from "mongoose";

interface IAnnouncement extends mongoose.Document {
	userId: string;
	content: string;
	date: Date;
	title: string;
	endDate: string;
	createdAt: Date;
	updatedAt: Date;
	eventId: string;
}

const announcementSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	content: { type: String, required: true },
	date: { type: Date, required: true },
	title: { type: String, required: true },
	endDate: { type: String },
	createdAt: Date,
	updatedAt: Date,
	eventId: String,
});

const Announcement = mongoose.model<IAnnouncement>(
	"Announcement",
	announcementSchema
);

export default Announcement;
