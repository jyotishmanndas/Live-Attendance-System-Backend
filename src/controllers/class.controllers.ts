import { Request, Response } from "express";
import { classSchema } from "../utils/zod";
import { Class } from "../models/class.model";

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
                studentsIds: newClass.students
            }
        })
    } catch (error) {
        console.log("Error while creating a class");
        return res.status(500).json({ msg: "Internal server error" })
    }
}