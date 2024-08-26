"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = void 0;
const HttpError_1 = __importDefault(require("./HttpError"));
const crypto_1 = __importDefault(require("crypto"));
const key = process.env.KEY;
const verifyOTP = async (hashedotp, otp, userId) => {
    const [hashValue, otpExpiry] = hashedotp.split(".");
    const otpExpiryDate = new Date(otpExpiry);
    const now = Date.now();
    if (now > otpExpiryDate.getTime()) {
        throw new HttpError_1.default("OTP expired", 401);
    }
    const otpdata = `${userId}.${otp}.${otpExpiry}`;
    const newCalculatedHash = crypto_1.default
        .createHmac("sha256", key)
        .update(otpdata)
        .digest("hex");
    if (hashValue === newCalculatedHash) {
        return true;
    }
    return false;
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=verifyOTP.js.map