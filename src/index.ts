import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import userRoute from "./routes/user.route";
import { connectDB } from "./db/db";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

connectDB();

app.use("/api/v1/user", userRoute);



app.listen(PORT, () => {
    console.log(`Server is listening to the port ${PORT}`);
})





