import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDb from "./config/dbConnection.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

const port = process.env.PORT;

//CORS Policy
app.use(cors());

//Database Connection
connectDb();

// Middleware to parse JSON in req.body
app.use(express.json());

// Load Routes
app.use("/api/user", userRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
