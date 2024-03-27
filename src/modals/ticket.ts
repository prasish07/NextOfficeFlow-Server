import mongoose from "mongoose";

export interface ITicket extends mongoose.Document {
	title: string;
	status: string;
	type: string;
	description: string;
	attachments: string[];
	assigneeId: string;
	priority: string;
	createdAt: Date;
	dueDate: Date;
	estimatedTime: string;
	reporterId: string;
	spentTime: string;
	linkedProject: string;
	comments: string[];
	grade: number;
}

const TicketSchema = new mongoose.Schema({
	title: { type: String, required: true },
	status: { type: String, required: true, default: "To Do" },
	
	type: { type: String },
	description: { type: String },
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
	createdAt: { type: Date },
	dueDate: { type: Date },
	estimatedTime: { type: String },
	grade: {
		type: Number,
		default: 0,
		min: 0,
		max: 10,
	},
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
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
