import { Request, Response } from "express";
import { signinSchema, signupSchema } from "../utils/zod";
import { User } from "../models/user.model";
import bcrypt from "bcrypt";
import { createAcessToken, createRefreshToken } from "../utils/authService";

export const userSignUp = async (req: Request, res: Response) => {
    try {
        const payload = signupSchema.safeParse(req.body);
        if (!payload.success) {
            return res.status(400).json({ msg: "Invalid inpust", succes: "false", error: payload.error.issues })
        };

        const existingUser = await User.findOne({
            email: payload.data.email
        });
        if (existingUser) {
            return res.status(400).json({ msg: "Email already exists" })
        };

        const hashedPassword = await bcrypt.hash(payload.data.password, 12);

        const user = await User.create({
            name: payload.data.name,
            email: payload.data.email,
            password: hashedPassword,
            role: payload.data.role
        });

        const accessToken = createAcessToken(user._id.toString(), user.role);
        const refreshToken = createRefreshToken(user._id.toString(), user.role);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
                maxAge: 15 * 60 * 1000
            })
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({
                msg: "User created succesfully", accessToken, data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            })

    } catch (error) {
        console.log("Error while signup", error);
        return res.status(500).json("internal server error");
    }
}

export const userSignIn = async (req: Request, res: Response) => {
    try {
        const payload = signinSchema.safeParse(req.body);
        if (!payload.success) {
            return res.status(400).json({ msg: "Invalid input", success: false, error: payload.error.issues })
        };

        const existingUser = await User.findOne({
            email: payload.data.email
        });
        if (!existingUser) {
            return res.status(400).json({ msg: "Email doesn't exists" })
        };

        const passwordCheck = await bcrypt.compare(payload.data.password, existingUser.password);
        if (!passwordCheck) {
            return res.status(400).json({ msg: "Invalid credentials" })
        };

        const accessToken = createAcessToken(existingUser._id.toString(), existingUser.role);
        const refreshToken = createRefreshToken(existingUser._id.toString(), existingUser.role);

        existingUser.refreshToken = refreshToken;
        await existingUser.save({ validateBeforeSave: false });

        return res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
                maxAge: 15 * 60 * 1000
            })
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({ msg: "Signin successfully", data: { accessToken } })

    } catch (error) {
        console.log("Error while signin", error);
        return res.status(500).json("internal server error");
    }
}

export const userDetails = (req: Request, res: Response) => {
    try {
        if (req.user) {
            return res.status(200).json({
                msg: "User data fetched successfully", data: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role
                }
            })
        }
    } catch (error) {
        console.log("Error while getting user details", error);
        return res.status(500).json({ msg: "Internal server error" })
    }
}