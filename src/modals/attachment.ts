import mongoose from "mongoose";

export interface IAttachment extends mongoose.Document {
	attachment: string;
	userId: string;
}

const attachmentSchema = new mongoose.Schema({
	attachment: { type: String, required: true },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
});

const Attachment = mongoose.model<IAttachment>("Attachment", attachmentSchema);

export default Attachment;
