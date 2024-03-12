import mongoose from "mongoose";

interface INotification extends mongoose.Document {
	userId: string;
	message: string;
	isSeen: boolean;
	link: string;
	type: string;
	createdAt: Date;
	updatedAt: Date;
}

const notificationSchema = new mongoose.Schema({
	userId: { type: String },
	message: { type: String },
	isSeen: { type: Boolean, default: false },
	link: { type: String },
	type: { type: String },
	createdAt: Date,
	updatedAt: Date,
});

const Notification = mongoose.model<INotification>(
	"Notification",
	notificationSchema
);

export default Notification;
