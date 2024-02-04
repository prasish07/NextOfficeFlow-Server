import mongoose from "mongoose";

export interface IAttachment extends mongoose.Document {
	attachment: string;
	UserId: string;
	projectId: string;
}

const attachmentSchema = new mongoose.Schema({
	attachment: { type: String, required: true },
	UserId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	projectId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Project",
	},
	ticketId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Ticket",
	},
});

const Attachment = mongoose.model<IAttachment>("Attachment", attachmentSchema);

export default Attachment;
