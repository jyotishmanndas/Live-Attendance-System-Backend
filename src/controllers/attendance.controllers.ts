import { Request, Response } from "express";
import { attendanceSchema } from "../utils/zod";
import { Class } from "../models/class.model";

interface ActiveSession {
    classId: string;
    startedAt: string;
    attendance: {
        [studentId: string]: "present" | "absent"
    }
}

export let activeSession: ActiveSession | null = null

export const startAttendance = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ msg: "Only teachers can start attendance" });
        }

        const payload = attendanceSchema.safeParse(req.body);
        if (!payload.success) {
            return res.status(400).json({ msg: "Invalid inputs" });
        }

        const classId = payload.data.classId;

        const classs = await Class.findById(classId);
        if (!classs) {
            return res.status(400).json({ msg: "Class not found" })
        };

        if (classs.teacherId.toString() !== req.user._id.toString()) {
            return res.status(400).json({ msg: "" })
        }

        // if (activeSession) {
        //     return res.status(409).json({
        //         success: false,
        //         msg: "Another attendance session is already running",
        //         data: activeSession,
        //     });
        // }

        activeSession = {
            classId,
            startedAt: new Date().toISOString(),
            attendance: {}
        }

        return res.status(200).json({
            success: true, data: {
                clasId: activeSession.classId,
                startedAt: activeSession.startedAt
            }
        })
    } catch (error) {
        console.error("Error while starting attendance:", error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
}