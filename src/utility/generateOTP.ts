import crypto from "crypto";
import * as dotenv from "dotenv";
import HTTPError from "./HttpError";
import { otpExipry } from "../constants/data";
dotenv.config();
const key = process.env.KEY as string;

export interface RetData {
  hashedotp: string;
  otp: number;
}

export const createOTP = async (
  userId: string,
  expiryTime: string
): Promise<RetData> => {
  try {
    //generating 4 digit otp
    const otp = Math.floor(1000 + Math.random() * 9000);

    //expiry in milliseconds
    const keys = Object.keys(otpExipry);
    const expiry = keys.find((key) => key == expiryTime) ?? "5m";
    const otpExpiryTime = new Date(
      Date.now() + otpExipry[expiry as keyof typeof otpExipry]
    );
    const otp_data = `${userId}.${otp}.${otpExpiryTime}`; //email.otp.expiry_timestamp
    const hashotp = crypto
      .createHmac("sha256", key)
      .update(otp_data)
      .digest("hex");
    const hashedotp = `${hashotp}.${otpExpiryTime}`;

    const retData: RetData = {
      hashedotp,
      otp,
    };

    return retData;
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      console.log(error);
      throw new HTTPError("Internal Server Error", 500);
    }
  }
};
