import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "teacher" | "student";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["teacher", "student"],
        required: true
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
});

export const User: Model<IUser> = mongoose.model("User", userSchema);