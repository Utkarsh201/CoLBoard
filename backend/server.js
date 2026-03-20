import app from "./app.js"
import dotenv from "dotenv";
import { ConnectDB } from "./config/connectDB.js";

dotenv.config();


async function startServer() {
  try {
    await ConnectDB();
    console.log("MongoDB connected");

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`the Server is running on the port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("DB connection error", err);
    process.exit(1);
  }
}

startServer();
