import { NextFunction, Request, Response } from "express";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authToken = req.headers["token"] as string;
  const token = process.env.TOKEN;

  if (!authToken) {
    return res.status(401).json({ message: "Unauthorized: Invalid request" });
  }

  if (token !== authToken) {
    return res.status(401).json({ message: "Unauthorized: Invalid request" });
  }

  next();
};
