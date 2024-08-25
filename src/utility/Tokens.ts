import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { access_token_expiry, refreshToken_expiry } from "../constants/data";
import { generateAccessTokenAdminInput } from "./DataTypes/types.admin";
import HTTPError from "./HttpError";
dotenv.config();

export const generateAccessToken = (userData: {
  id: string;
  emailId: string | null;
  phoneNumber: string | null;
  currentSessionId: string;
}): string => {
  try {
    const accessToken = jwt.sign(
      userData,
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: access_token_expiry,
        // expiresIn:"5m"
      }
    );
    return accessToken;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const generateRefreshToken = (userData: {
  id: string;
  emailId: string | null;
  phoneNumber: string | null;
  currentSessionId: string;
}): string => {
  try {
    const refreshToken = jwt.sign(
      userData,
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: refreshToken_expiry,
        // expiresIn:"10m"
      }
    );
    return refreshToken;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//admin token

export const generateAccessTokenAdmin = (
  adminData: generateAccessTokenAdminInput
) => {
  const accessToken = jwt.sign(
    adminData,
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: access_token_expiry,
      // expiresIn: "10m",
    }
  );
  return accessToken;
};

export const generateRefreshTokenAdmin = (
  adminData: generateAccessTokenAdminInput
) => {
  const refreshToken = jwt.sign(
    adminData,
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: refreshToken_expiry,
      // expiresIn: "15m",
    }
  );
  return refreshToken;
};
