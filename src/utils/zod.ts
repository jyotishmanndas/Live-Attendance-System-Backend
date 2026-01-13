import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().trim().min(2, { error: "Name must be at least 2 charactes long" }),
    email: z.email().trim(),
    role: z.enum(["teacher", "student"], { error: "Role must be either teacher or student" }),
    password: z.string()
        .min(6, { error: "Passoword must be at least 6 characters long" })
        .max(15, { error: "Password must be at most 15 characters long" })
        .regex(/[A-Z]/, { error: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { error: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { error: 'Password must contain at least one number' })
        .regex(/[@$!%*?&]/, { error: 'Password must contain at least one special character' })
});

export const signinSchema = z.object({
    email: z.email().trim(),
    password: z.string()
        .min(6, { error: "Passoword must be at least 6 characters long" })
        .max(15, { error: "Password must be at most 15 characters long" })
        .regex(/[A-Z]/, { error: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { error: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { error: 'Password must contain at least one number' })
        .regex(/[@$!%*?&]/, { error: 'Password must contain at least one special character' })
});

export const classSchema = z.object({
    className: z.string().min(3).max(15)
});

export const studentSchema = z.object({
    studentId: z.string().min(5)
})