import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
        if (!mongoUri) {
            throw new Error("Missing MongoDB connection string. Set MONGO_URI or DATABASE_URL.");
        }

        const conn = await mongoose.connect(mongoUri)
        // if you for the production grade
        // pool size limits the number of connection
        // fails in 5 sec if the DB is unreachable
        // const conn = await mongoose.connect(mongoUri, {
        //     maxPoolSize: 10,
        //     serverSelectionTimeoutMS: 5000,
        // })
        console.log(`Database is connect host : ${conn.connection.host}`)
    } catch (error) {
        console.error("failed to connect to the database", error.message)
        process.exit(1)
    }
}


export { ConnectDB }
