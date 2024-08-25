import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import HTTPError from "../utility/HttpError";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as dotenv from "dotenv";
import { remainingTime } from "../utility/BlockUserRemainingTime";
dotenv.config();

export const verifyUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract and Validate Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new HTTPError("Invalid authorization header format.", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new HTTPError("No token provided.", 401);
    }

    const decodedToken = jwt.decode(token) as JwtPayload;

    if (!decodedToken) throw new HTTPError("Invalid Token.", 401);
    // 3. Find User
    const user = await prisma.users.findUnique({
      where: { id: decodedToken["id"] },
    });
    if (!user) {
      throw new HTTPError("User not found.", 404);
    }

    //check if user is blocked and return the time remaining
    if (user.isBlocked == true && user.blockedAt) {
      const error =await remainingTime(user.blockedAt)
      throw new HTTPError(JSON.stringify(error), 403);
    }

    //check if active session
    if (
      user.currentSessionId !== decodedToken.currentSessionId &&
      user.currentSessionId === null
    ) {
      throw new HTTPError("Session invalidated. Please log in again.", 403);
    }
    if (
      user.currentSessionId !== decodedToken.currentSessionId ||
      user.currentSessionId === null ||
      decodedToken.currentSessionId === null
    ) {
      throw new HTTPError("Session invalidated. Please log in again.", 403);
    }
    //check if access token is expired or not
    if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
      req.expiredToken = {
        accessToken: token,
      };
      throw new HTTPError(
        "Access Token is expired. Generate a new one using /api/user/refresh-token",
        401
      );
    } else {
      // Access token still valid
      req.user = {
        id: user?.id,
        fullName: user.fullName,
        emailId: user?.emailId,
        phoneNumber: user?.phoneNumber,
        isSync: user.isSync,
        subscription: user.subscription,
        accessToken: token,
      };
    }
    next();
  } catch (err: HTTPError | Error | any) {
    console.error("Error caught in errorHandler:", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
