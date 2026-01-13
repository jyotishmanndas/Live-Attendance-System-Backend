import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IClass extends Document {
    className: string;
    teacherId: Types.ObjectId;
    studentIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}


const classSchema = new Schema<IClass>({
    className: {
        type: String,
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    studentIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]

}, { timestamps: true });


export const Class: Model<IClass> = mongoose.model("Class", classSchema)