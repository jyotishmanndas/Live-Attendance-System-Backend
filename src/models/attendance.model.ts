import mongoose, { Schema, Model, Document, Types } from "mongoose";

type Status = "present" | "absent";

interface IAttendance extends Document {
    classId: Types.ObjectId,
    studentId: Types.ObjectId,
    status: Status,
    createdAt: Date,
    updatedAt: Date
}

const attendanceSchema = new Schema<IAttendance>({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["present", "absent"],
        required: true
    }

}, {
    timestamps: true
});

export const Attendance: Model<IAttendance> = mongoose.model("Attendance", attendanceSchema);
