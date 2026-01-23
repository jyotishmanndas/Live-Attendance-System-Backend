import { WebSocketServer, WebSocket } from 'ws';
import jwt from "jsonwebtoken";
import { activeSession } from '../controllers/attendance.controllers';
import type { createServer } from "http";

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

            ws.on("message", (data) => {
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