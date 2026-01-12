import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import userRoute from "./routes/user.route";
import classRoute from "./routes/class.route";
import { connectDB } from "./db/db";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

connectDB();

app.use("/api/v1/user", userRoute);
app.use("/api/v1/class", classRoute);



app.listen(PORT, () => {
    console.log(`Server is listening to the port ${PORT}`);
})





