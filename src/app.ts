import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { authenticate } from "./middleware";
import { handleScore } from "./controllers/score";
import { handleAnalytics } from "./controllers/analytics";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Health check  ✔ ");
});

app.post("/score", authenticate, handleScore);
app.post("/analytics", authenticate, handleAnalytics);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
