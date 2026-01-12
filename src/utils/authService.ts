import jwt from "jsonwebtoken";


export const createAcessToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" })
}

export const createRefreshToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" })
}