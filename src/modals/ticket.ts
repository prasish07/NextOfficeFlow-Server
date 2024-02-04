import mongoose from "mongoose";

export interface ITicket extends mongoose.Document {
	title: string;
	status: string;
	type: string;
	Description: string;
	attachments: string[];
	assigneeId: string;
	priority: string;
	startDate: Date;
	dueDate: Date;
	estimatedTime: string;
	reporterId: string;
	Progress: number;
	spentTime: string;
	linkedProjects: string[];
	comments: string[];
}

const TicketSchema = new mongoose.Schema({
	title: { type: String, required: true },
	status: { type: String, required: true, default: "To Do" },
	type: { type: String },
	Description: { type: String },
	attachments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Attachment",
		},
	],
	assigneeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	priority: { type: String },
	startDate: { type: Date, required: true },
	dueDate: { type: Date, required: true },
	estimatedTime: { type: String },
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	Progress: { type: Number },
	spentTime: { type: String },
	linkedProjects: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
		},
	],
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
	],
});

const Project = mongoose.model<ITicket>("Project", TicketSchema);

export default Project;
