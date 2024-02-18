import mongoose from "mongoose";

export interface IRequest extends mongoose.Document {
    userId: string;
    type: string; 
    status: string; 
    details: string; 
    createdAt: Date;
    updatedAt: Date;
}

const requestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    status: { type: String, required: true, default: 'pending' },
    details: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Request = mongoose.model<IRequest>("Request", requestSchema);

export default Request;
