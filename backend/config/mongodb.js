import mongoose from "mongoose";

const connectDB = async () =>{

    mongoose.connection.on('connected', () => console.log("Database Connected"))

    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/vaidyam`)
    } catch (error) {
        console.warn("⚠️  MongoDB connection failed. Running in demo mode without database persistance.")
        console.warn("To enable database features, start MongoDB on localhost:27017 or update MONGODB_URL in .env")
    }
}

export default connectDB