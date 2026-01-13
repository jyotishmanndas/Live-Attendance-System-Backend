import { Request, Response } from "express";
import { classSchema, studentSchema } from "../utils/zod";
import { Class } from "../models/class.model";
import { User } from "../models/user.model";

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
                id: newClass._id,
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
        }

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