import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/prisma";
import dotenv from "dotenv";
import AuthRouter from "./routes/auth.routes";
import NotesRouter from "./routes/note.routes";

dotenv.config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(helmet());

app.use(cors({ origin: ["http://localhost:8001", "*"] }));

app.use(morgan("combined"));

app.get("/", (_req: Request, res: Response) => {
  res.send("Notely server is live");
});

app.use("/api/auth", AuthRouter);
app.use("/api/notes", NotesRouter);

const PORT = process.env.PORT || 5600;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

startServer();
