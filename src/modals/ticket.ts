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
	linkedProject: string;
	comments: string[];
	grading: number;
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
	startDate: { type: Date },
	dueDate: { type: Date },
	estimatedTime: { type: String },
	grading: {
		type: Number,
		default: 0,
		min: 0,
		max: 10,
	},
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	Progress: { type: Number },
	spentTime: { type: String },

	linkedProject: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Project",
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
	],
});

const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
