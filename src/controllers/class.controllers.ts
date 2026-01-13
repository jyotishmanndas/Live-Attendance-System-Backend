import { Request, Response } from "express";
import { classSchema, studentSchema } from "../utils/zod";
import { Class } from "../models/class.model";
import { User } from "../models/user.model";
import mongoose from "mongoose";

export const createClass = async (req: Request, res: Response) => {
    try {
        const payload = classSchema.safeParse(req.body);
        if (!payload.success) {
            return res.status(400).json({ msg: "Invalid input", error: payload.error.issues })
        };

        if (req.user?.role !== "teacher") {
            return res.status(403).json({ msg: "Only teachers can create classes" })
        }

        const newClass = await Class.create({
            className: payload.data.className,
            teacherId: req.user?._id
        });

        return res.status(200).json({
            msg: "class created successfully", data: {
                _id: newClass._id,
                className: newClass.className,
                teacherId: newClass.teacherId,
                studentIds: newClass.studentIds
            }
        })
    } catch (error) {
        console.log("Error while creating a class");
        return res.status(500).json({ msg: "Internal server error" })
    }
};

export const addStudent = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ msg: "Only teacher can add student" })
        };

        const payload = studentSchema.safeParse(req.body);
        if (!payload.success) {
            return res.status(400).json({ msg: "Invalid inputs", errror: payload.error.issues })
        };

        const classId = req.params.classId;
        const studentId = payload.data.studentId;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(400).json({ msg: "Class not found" });
        };

        if (classDoc.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "You don't own this class" });
        };

        const studentUser = await User.findById(studentId);
        if (!studentUser) {
            return res.status(400).json({ msg: "Student not found" })
        };

        if (studentUser.role !== "student") {
            return res.status(400).json({ msg: "This user is not a student" });
        }

        await Class.findByIdAndUpdate(classId, {
            $addToSet: {
                studentIds: studentUser._id
            }
        });

        return res.status(200).json({ msg: "Student add successfully" });
    } catch (error) {
        console.error("Error while adding student", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}

export const getClassDetails = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;

        const classDoc = await Class.findById(classId)
            .populate("studentIds", "_id name email");
        if (!classDoc) {
            return res.status(404).json({ msg: "Class not found" });
        };

        const userId = req.user?._id.toString();

        const isTeacherOwner = req.user?.role === "teacher" && classDoc.teacherId.toString() === userId;
        const isStudentEnrolled = req.user?.role === "student" && classDoc.studentIds.some((s) => s._id.toString() === userId);

        if (!isTeacherOwner && !isStudentEnrolled) {
            return res.status(403).json({ msg: "You are not allowed to view this class" });
        }

        return res.status(200).json({
            msg: "Class details fetched successfully",
            data: classDoc,
        });
    } catch (error) {
        console.error("Error while fetching class details:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}

export const getStudentDetails = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ msg: "Only teacher can get student details" })
        };

        const { classId } = req.params;

        const student = await Class.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(classId.toString())
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "studentIds",
                    foreignField: "_id",
                    as: "studentIds",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    studentIds: 1
                }
            }
        ])


        return res.status(200).json({ data: student })


    } catch (error) {
        console.error("Error while fetching students details:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ msg: "Only teacher can get student details" })
        };

        const students = await User.find({
            role: "student"
        }).select("-password -refreshToken -role");

        return res.status(200).json({ data: students })

    } catch (error) {
        console.error("Error while fetching students:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}