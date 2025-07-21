import express, { Request, Response } from "express";
const app = express();
app.use(express.json());
app.get("/", (_req: Request, res: Response) => {
  res.send("Notely server is live");
});
const PORT = process.env.PORT || 5600;

app.listen(PORT, () => {
  console.log(`server running at port: ${PORT}`);
});
