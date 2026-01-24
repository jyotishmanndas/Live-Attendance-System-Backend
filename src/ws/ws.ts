import { WebSocketServer, WebSocket } from 'ws';
import jwt from "jsonwebtoken";
import { activeSession } from '../controllers/attendance.controllers';
import type { createServer } from "http";
import { Class } from '../models/class.model';
import { Attendance } from '../models/attendance.model';

type WSUser = {
    userId: string;
    role: "teacher" | "student";
};

type AuthedWebSocket = WebSocket & { user?: WSUser };

const clients = new Set<AuthedWebSocket>();

export const initWebSocket = (server: ReturnType<typeof createServer>) => {
    const wss = new WebSocketServer({
        server,
        path: "/ws"
    });

    wss.on('connection', function connection(ws: AuthedWebSocket, req) {
        try {
            const url = req.url;
            if (!url) return;

            const params = new URLSearchParams(url.split("?")[1]);
            const token = params.get("token");
            if (!token) {
                ws.send(JSON.stringify({ data: { message: 'Token missing' } }));
                ws.close();
                return;
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as WSUser;
            if (!decoded.userId || !decoded.role) {
                ws.send(JSON.stringify({ data: { message: 'Unauthorized or invalid token' } }));
                ws.close();
                return;
            }

            // Attach user info to ws in a type-safe way
            ws.user = { userId: decoded.userId, role: decoded.role };

            clients.add(ws);

            ws.on("message", async (data) => {
                const message = JSON.parse(data.toString());

                switch (message.event) {
                    case "ATTENDANCE_MARKED": {
                        if (!activeSession || activeSession.classId.length <= 0) {
                            ws.send(JSON.stringify({ message: "No active attendance sesssion" }));
                            return;
                        };

                        if (ws.user?.role !== "teacher") {
                            ws.send(JSON.stringify({ message: "teacher only event" }));
                            return
                        };

                        const studentId = message.data.studentId;
                        activeSession.attendance = { ...activeSession.attendance, [studentId]: message.data.status };
                        const currentStudentIdStatus = activeSession.attendance[studentId]
                        console.log(activeSession);

                        clients.forEach((s) => {
                            if (s.readyState === WebSocket.OPEN) {
                                s.send(JSON.stringify({
                                    event: "ATTENDANCE_MARKED",
                                    data: {
                                        studentId: studentId,
                                        status: currentStudentIdStatus
                                    }
                                }))
                            }
                        });
                        break;
                    }
                    case "TODAY_SUMMARY": {
                        if (!activeSession || activeSession.classId.length <= 0) {
                            ws.send(JSON.stringify({ message: "No active attendance sesssion" }));
                            return;
                        };

                        if (ws.user?.role !== "teacher") {
                            ws.send(JSON.stringify({ message: "teacher only event" }));
                            return
                        };

                        const attendance = Object.values(activeSession.attendance);
                        const present = attendance.filter((x) => x === "present").length;
                        const absent = attendance.filter((x) => x === "absent").length;
                        const total = attendance.length;

                        clients.forEach((x) => {
                            if (x.readyState === WebSocket.OPEN) {
                                x.send(JSON.stringify({
                                    event: "TODAY_SUMMARY",
                                    data: {
                                        present: present,
                                        absent: absent,
                                        total: total
                                    }
                                }))
                            }
                        });
                        break;
                    }
                    case "MY_ATTENDANCE": {
                        if (!activeSession || activeSession.classId.length <= 0) {
                            ws.send(JSON.stringify({ message: "No active attendance sesssion" }));
                            return
                        };

                        if (ws.user?.role !== "student") {
                            ws.send(JSON.stringify({ message: "student only event" }))
                            return
                        };

                        const studentAttendance = activeSession.attendance[ws.user.userId];

                        if (!studentAttendance) {
                            ws.send(JSON.stringify({
                                event: "MY_ATTENDANCE",
                                data: {
                                    status: "Not yet updated"
                                }
                            }));
                            return
                        }

                        ws.send(JSON.stringify({
                            event: "MY_ATTENDANCE",
                            data: {
                                status: studentAttendance
                            }
                        }));
                        break;
                    }
                    case "DONE": {
                        if (!activeSession || !activeSession.classId) {
                            ws.send(JSON.stringify({ message: "No active attendance session" }));
                            return
                        };

                        if (ws.user?.role !== "teacher") {
                            ws.send(JSON.stringify({ message: "Teacher only event" }));
                            return;
                        };

                        const activeClass = await Class.findById(activeSession?.classId);;
                        if (!activeClass) {
                            ws.send(JSON.stringify({ message: "Class not found" }));
                            return;
                        };
                        const allStudents = activeClass?.studentIds;

                        allStudents?.map((s) => {
                            if (!activeSession) {
                                ws.send(JSON.stringify({ message: "No active attendance session" }));
                                return
                            };

                            if (!activeSession?.attendance[s.toString()]) {
                                activeSession.attendance[s.toString()] = "absent"
                            }
                        });

                        const attendance = Object.values(activeSession.attendance);
                        const present = attendance.filter((x) => x === "present").length;
                        const absent = attendance.filter((x) => x === "absent").length;
                        const total = attendance.length;

                        await Promise.all(
                            allStudents.map((s) => {
                                const studentId = s.toString();
                                const status = activeSession?.attendance[studentId];

                                return Attendance.create({
                                    classId: activeSession?.classId,
                                    studentId: s,
                                    status: status
                                })
                            })
                        );

                        clients.forEach((x) => {
                            if (x.readyState === WebSocket.OPEN) {
                                x.send(JSON.stringify({
                                    event: "DONE",
                                    data: {
                                        message: "Attendance persisted",
                                        present: present,
                                        absent: absent,
                                        total: total
                                    }
                                }))
                            }
                        })
                        break;
                    }
                    default: {
                        ws.send(JSON.stringify({ success: false, msg: "Unknown event" }));
                        return;
                    }
                }
            })

        } catch (error) {
            ws.send(JSON.stringify({ success: false, msg: "Unauthorized or invalid token" }));
            ws.close();
        }

    });
}