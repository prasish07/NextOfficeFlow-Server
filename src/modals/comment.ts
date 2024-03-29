import mongoose from "mongoose";

export interface IComment extends mongoose.Document {
	comment: string;
	userId: string;
	projectId: string;
	// ticketId: string;
}

const commentSchema = new mongoose.Schema({
	comment: { type: String, required: true },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	projectId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Project",
	},
	// ticketId: {
	// 	type: mongoose.Schema.Types.ObjectId,
	// 	ref: "Ticket",
	// },
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
