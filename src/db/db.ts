import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoDbIntance = await mongoose.connect(`${process.env.MONGODB_URI}/attendence-system`);
        console.log(`\n MongoDb connected ${mongoDbIntance.connection.host}`);

    } catch (error) {
        console.log("Error while connected to mongodb", error);
        process.exit(1)
    }
}